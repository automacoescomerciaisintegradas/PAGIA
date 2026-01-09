import { Skill, SkillContext } from './types.js';
import * as fs from 'fs/promises';
import * as path from 'path';

interface ContextNode {
  id: string;
  title: string;
  content: string;
  filePath?: string;
  children: ContextNode[];
  metadata: {
    type: string;
    priority: number;
    lastUpdated: Date;
    relevanceScore?: number;
    embedding?: number[]; // For semantic search
    tags?: string[]; // For filtering
    size?: number; // File size
    author?: string; // Author information
    version?: string; // Version information
  };
}

interface ContextTree {
  root: ContextNode;
  nodes: Map<string, ContextNode>;
  embeddingsIndex?: Map<string, number[]>; // Index for semantic search
}

// Mock embedding function - in a real implementation, this would call an AI service
function generateEmbedding(text: string): number[] {
  // This is a simplified mock embedding generator
  // In a real implementation, you would use a proper embedding service
  const encoder = new TextEncoder();
  const data = encoder.encode(text.toLowerCase());
  const embedding: number[] = [];

  // Generate a deterministic "embedding" based on character codes
  for (let i = 0; i < Math.min(1536, data.length); i++) {
    embedding.push(data[i] / 255); // Normalize to 0-1 range
  }

  // Pad with zeros if needed
  while (embedding.length < 1536) {
    embedding.push(0);
  }

  return embedding;
}

// Calculate cosine similarity between two embeddings
function cosineSimilarity(a: number[], b: number[]): number {
  if (a.length !== b.length) {
    throw new Error('Embeddings must have the same length');
  }

  let dotProduct = 0;
  let normA = 0;
  let normB = 0;

  for (let i = 0; i < a.length; i++) {
    dotProduct += a[i] * b[i];
    normA += a[i] * a[i];
    normB += b[i] * b[i];
  }

  if (normA === 0 || normB === 0) {
    return 0;
  }

  return dotProduct / (Math.sqrt(normA) * Math.sqrt(normB));
}

export const contextCuration: Skill = {
  name: 'context-curation',
  description: 'Curates and organizes context into a hierarchical tree structure for AI processing with advanced semantic capabilities',
  run: async (context: SkillContext) => {
    const { input } = context;

    // Parse the input to determine the operation
    const params = parseInput(input);

    if (params.operation === 'build-tree') {
      return await buildContextTree(params.sourceDir, params.patterns);
    } else if (params.operation === 'search') {
      return await searchContextTree(params.query);
    } else if (params.operation === 'semantic-search') {
      return await semanticSearchContextTree(params.query);
    } else if (params.operation === 'add-document') {
      return await addDocumentToTree(params.filePath, params.category, params.tags?.split(',') || []);
    } else if (params.operation === 'filter') {
      return await filterContextTree(params.type, params.tag, params.priority);
    } else if (params.operation === 'stats') {
      return await getContextStats();
    } else {
      return 'Invalid operation. Supported operations: build-tree, search, semantic-search, add-document, filter, stats';
    }
  }
};

function parseInput(input: string): any {
  // Simple parser for input commands
  const parts = input.trim().split(' ');
  const operation = parts[0];

  const params: any = { operation };

  for (let i = 1; i < parts.length; i += 2) {
    const key = parts[i].replace('--', '');
    const value = parts[i + 1];
    params[key] = value;
  }

  return params;
}

async function buildContextTree(sourceDir: string = '.', patterns: string[] = ['*.md', '*.txt', '*.ts', '*.js']): Promise<string> {
  const tree: ContextTree = {
    root: {
      id: 'root',
      title: 'Project Context Tree',
      content: 'Root of the context tree',
      children: [],
      metadata: {
        type: 'root',
        priority: 0,
        lastUpdated: new Date()
      }
    },
    nodes: new Map(),
    embeddingsIndex: new Map()
  };

  tree.nodes.set('root', tree.root);

  // Add categories as top-level nodes
  const categories = ['documentation', 'code', 'tests', 'config'];

  for (const category of categories) {
    const categoryNode: ContextNode = {
      id: `category-${category}`,
      title: capitalize(category),
      content: `${capitalize(category)} files and resources`,
      children: [],
      metadata: {
        type: 'category',
        priority: 1,
        lastUpdated: new Date()
      }
    };

    tree.root.children.push(categoryNode);
    tree.nodes.set(categoryNode.id, categoryNode);
  }

  // For simplicity, we'll just scan the source directory synchronously
  // In a real implementation, we might want to use a glob library
  try {
    const files = await fs.readdir(sourceDir);

    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const stat = await fs.stat(filePath);

      if (stat.isFile()) {
        // Check if file matches our patterns
        const matchesPattern = patterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\./g, '\\.'));
          return regex.test(file);
        });

        if (matchesPattern) {
          const content = await fs.readFile(filePath, 'utf-8');

          // Determine category based on file extension
          let category = 'code';
          if (file.endsWith('.md')) category = 'documentation';
          else if (file.includes('.test.') || file.includes('.spec.')) category = 'tests';
          else if (file.includes('config') || file.includes('.json') || file.includes('.yaml') || file.includes('.yml')) category = 'config';

          const nodeId = `file-${file.replace(/[\/\\]/g, '-')}`;

          // Generate embedding for semantic search
          const embedding = generateEmbedding(content);

          const fileNode: ContextNode = {
            id: nodeId,
            title: file,
            content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // Truncate long content
            filePath: filePath,
            children: [],
            metadata: {
              type: 'file',
              priority: 2,
              lastUpdated: stat.mtime,
              embedding: embedding,
              size: stat.size,
              tags: [] // Default empty tags array
            }
          };

          // Add to appropriate category
          const categoryNode = tree.nodes.get(`category-${category}`);
          if (categoryNode) {
            categoryNode.children.push(fileNode);
            tree.nodes.set(nodeId, fileNode);

            // Add to embeddings index
            if (tree.embeddingsIndex) {
              tree.embeddingsIndex.set(nodeId, embedding);
            }
          }
        }
      }
    }
  } catch (error) {
    return `Error scanning directory: ${(error as Error).message}`;
  }

  // Save the tree structure
  await saveContextTree(tree);

  return `Context tree built with ${tree.nodes.size} nodes`;
}

async function searchContextTree(query: string): Promise<string> {
  // Load the tree
  const tree = await loadContextTree();

  if (!tree) {
    return 'Context tree not found. Please build the tree first.';
  }

  // Simple search implementation
  const results: ContextNode[] = [];

  for (const node of tree.nodes.values()) {
    if (
      node.title.toLowerCase().includes(query.toLowerCase()) ||
      node.content.toLowerCase().includes(query.toLowerCase())
    ) {
      results.push(node);
    }
  }

  // Sort by relevance (priority and content match)
  results.sort((a, b) => {
    // Prioritize nodes with title matches over content matches
    const aTitleMatch = a.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;
    const bTitleMatch = b.title.toLowerCase().includes(query.toLowerCase()) ? 1 : 0;

    if (aTitleMatch !== bTitleMatch) {
      return bTitleMatch - aTitleMatch; // Higher priority to title matches
    }

    // Then sort by priority
    return a.metadata.priority - b.metadata.priority;
  });

  // Return top 5 results
  const topResults = results.slice(0, 5);

  let output = `Search results for "${query}":\n\n`;
  for (const result of topResults) {
    output += `- ${result.title}\n`;
    if (result.filePath) {
      output += `  Path: ${result.filePath}\n`;
    }
    output += `  Type: ${result.metadata.type}\n`;
    output += `  Priority: ${result.metadata.priority}\n\n`;
  }

  return output;
}

async function semanticSearchContextTree(query: string): Promise<string> {
  // Load the tree
  const tree = await loadContextTree();

  if (!tree) {
    return 'Context tree not found. Please build the tree first.';
  }

  if (!tree.embeddingsIndex) {
    return 'Embeddings index not available. Please rebuild the context tree.';
  }

  // Generate embedding for the query
  const queryEmbedding = generateEmbedding(query);

  // Calculate similarity scores for all nodes
  const similarities: { nodeId: string; score: number }[] = [];

  for (const [nodeId, node] of tree.nodes) {
    if (node.metadata.embedding) {
      const similarity = cosineSimilarity(queryEmbedding, node.metadata.embedding);
      similarities.push({ nodeId, score: similarity });
    }
  }

  // Sort by similarity score (descending)
  similarities.sort((a, b) => b.score - a.score);

  // Get top 5 results
  const topSimilarities = similarities.slice(0, 5);

  let output = `Semantic search results for "${query}":\n\n`;
  for (const { nodeId, score } of topSimilarities) {
    const node = tree.nodes.get(nodeId)!;
    output += `- ${node.title} (Similarity: ${(score * 100).toFixed(2)}%)\n`;
    if (node.filePath) {
      output += `  Path: ${node.filePath}\n`;
    }
    output += `  Type: ${node.metadata.type}\n\n`;
  }

  return output;
}

async function addDocumentToTree(filePath: string, category: string = 'documentation', tags: string[] = []): Promise<string> {
  try {
    const content = await fs.readFile(filePath, 'utf-8');
    const fileName = path.basename(filePath);

    // Load existing tree
    let tree = await loadContextTree();

    if (!tree) {
      // Create a new tree if none exists
      tree = {
        root: {
          id: 'root',
          title: 'Project Context Tree',
          content: 'Root of the context tree',
          children: [],
          metadata: {
            type: 'root',
            priority: 0,
            lastUpdated: new Date()
          }
        },
        nodes: new Map(),
        embeddingsIndex: new Map()
      };

      tree.nodes.set('root', tree.root);
    }

    // Check if category exists, create if not
    const categoryId = `category-${category}`;
    let categoryNode = tree.nodes.get(categoryId);

    if (!categoryNode) {
      categoryNode = {
        id: categoryId,
        title: capitalize(category),
        content: `${capitalize(category)} files and resources`,
        children: [],
        metadata: {
          type: 'category',
          priority: 1,
          lastUpdated: new Date()
        }
      };

      tree.root.children.push(categoryNode);
      tree.nodes.set(categoryId, categoryNode);
    }

    // Create node for the document
    const nodeId = `file-${filePath.replace(/[\/\\]/g, '-')}`;

    // Generate embedding for semantic search
    const embedding = generateEmbedding(content);

    const fileNode: ContextNode = {
      id: nodeId,
      title: fileName,
      content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
      filePath: filePath,
      children: [],
      metadata: {
        type: 'file',
        priority: 2,
        lastUpdated: new Date((await fs.stat(filePath)).mtime),
        embedding: embedding,
        size: (await fs.stat(filePath)).size,
        tags: tags
      }
    };

    // Add to category
    categoryNode.children.push(fileNode);
    tree.nodes.set(nodeId, fileNode);

    // Add to embeddings index
    if (tree.embeddingsIndex) {
      tree.embeddingsIndex.set(nodeId, embedding);
    }

    // Save updated tree
    await saveContextTree(tree);

    return `Document "${fileName}" added to category "${category}" with tags: [${tags.join(', ')}]`;
  } catch (error) {
    return `Error adding document: ${(error as Error).message}`;
  }
}

async function filterContextTree(type?: string, tag?: string, priority?: string): Promise<string> {
  // Load the tree
  const tree = await loadContextTree();

  if (!tree) {
    return 'Context tree not found. Please build the tree first.';
  }

  // Filter nodes based on criteria
  const filteredNodes: ContextNode[] = [];

  for (const node of tree.nodes.values()) {
    let matches = true;

    // Filter by type
    if (type && node.metadata.type !== type) {
      matches = false;
    }

    // Filter by tag
    if (tag && node.metadata.tags && !node.metadata.tags.includes(tag)) {
      matches = false;
    }

    // Filter by priority
    if (priority && node.metadata.priority !== parseInt(priority)) {
      matches = false;
    }

    if (matches) {
      filteredNodes.push(node);
    }
  }

  // Return filtered results
  let output = `Filtered context results:\n\n`;
  for (const node of filteredNodes) {
    output += `- ${node.title}\n`;
    if (node.filePath) {
      output += `  Path: ${node.filePath}\n`;
    }
    output += `  Type: ${node.metadata.type}\n`;
    output += `  Priority: ${node.metadata.priority}\n`;
    if (node.metadata.tags && node.metadata.tags.length > 0) {
      output += `  Tags: [${node.metadata.tags.join(', ')}]\n`;
    }
    output += `\n`;
  }

  return output;
}

async function getContextStats(): Promise<string> {
  // Load the tree
  const tree = await loadContextTree();

  if (!tree) {
    return 'Context tree not found. Please build the tree first.';
  }

  // Calculate statistics
  const stats: { [key: string]: number } = {};
  let totalSize = 0;

  for (const node of tree.nodes.values()) {
    if (node.metadata.type) {
      stats[node.metadata.type] = (stats[node.metadata.type] || 0) + 1;
    }

    if (node.metadata.size) {
      totalSize += node.metadata.size;
    }
  }

  let output = `Context tree statistics:\n\n`;
  output += `Total nodes: ${tree.nodes.size}\n`;
  output += `Total size: ${totalSize} bytes (${(totalSize / 1024).toFixed(2)} KB)\n\n`;
  output += `By type:\n`;

  for (const [type, count] of Object.entries(stats)) {
    output += `  ${type}: ${count}\n`;
  }

  return output;
}

async function saveContextTree(tree: ContextTree): Promise<void> {
  const treePath = path.join(process.cwd(), '.pagia', 'context-tree.json');

  // Ensure .pagia directory exists
  await fs.mkdir(path.dirname(treePath), { recursive: true });

  // Convert Map to object for serialization (excluding embeddingsIndex which can be regenerated)
  const serializableTree = {
    root: tree.root,
    nodes: Array.from(tree.nodes.entries()),
    // Don't serialize embeddingsIndex to save space; it can be regenerated
  };

  await fs.writeFile(treePath, JSON.stringify(serializableTree, null, 2));
}

async function loadContextTree(): Promise<ContextTree | null> {
  const treePath = path.join(process.cwd(), '.pagia', 'context-tree.json');

  try {
    const data = await fs.readFile(treePath, 'utf-8');
    const parsed = JSON.parse(data);

    // Convert back to Maps
    const tree: ContextTree = {
      root: parsed.root,
      nodes: new Map(parsed.nodes),
      embeddingsIndex: new Map() // Will be regenerated as needed
    };

    // Regenerate embeddings index
    for (const [nodeId, node] of tree.nodes) {
      if (node.metadata.embedding) {
        tree.embeddingsIndex!.set(nodeId, node.metadata.embedding);
      }
    }

    return tree;
  } catch (error) {
    return null;
  }
}

function capitalize(str: string): string {
  return str.charAt(0).toUpperCase() + str.slice(1);
}