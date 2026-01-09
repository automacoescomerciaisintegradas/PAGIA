const fs = require('fs').promises;
const path = require('path');
const { glob } = require('glob');

class ContextCuration {
  constructor() {
    this.contextTree = {
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
      nodes: new Map()
    };
    
    this.contextTree.nodes.set('root', this.contextTree.root);
  }

  async buildContextTree(sourceDir = '.', patterns = ['**/*.md', '**/*.txt', '**/*.ts', '**/*.js']) {
    // Add categories as top-level nodes
    const categories = ['documentation', 'code', 'tests', 'config'];
    
    for (const category of categories) {
      const categoryNode = {
        id: `category-${category}`,
        title: this.capitalize(category),
        content: `${this.capitalize(category)} files and resources`,
        children: [],
        metadata: {
          type: 'category',
          priority: 1,
          lastUpdated: new Date()
        }
      };
      
      this.contextTree.root.children.push(categoryNode);
      this.contextTree.nodes.set(categoryNode.id, categoryNode);
    }
    
    // Scan for files matching patterns
    for (const pattern of patterns) {
      const files = await glob(path.join(sourceDir, pattern), { ignore: ['node_modules/**', '.git/**', '.pagia/**'] });
      
      for (const file of files) {
        const content = await fs.readFile(file, 'utf-8');
        const relativePath = path.relative(sourceDir, file);
        const segments = relativePath.split(/[\/\\]/);
        const fileName = segments[segments.length - 1];
        
        // Determine category based on file extension
        let category = 'code';
        if (fileName.endsWith('.md')) category = 'documentation';
        else if (fileName.includes('.test.') || fileName.includes('.spec.')) category = 'tests';
        else if (fileName.includes('config') || fileName.includes('.json') || fileName.includes('.yaml') || fileName.includes('.yml')) category = 'config';
        
        const nodeId = `file-${relativePath.replace(/[\/\\]/g, '-')}`;
        
        const fileNode = {
          id: nodeId,
          title: fileName,
          content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // Truncate long content
          filePath: file,
          children: [],
          metadata: {
            type: 'file',
            priority: 2,
            lastUpdated: new Date((await fs.stat(file)).mtime)
          }
        };
        
        // Add to appropriate category
        const categoryNode = this.contextTree.nodes.get(`category-${category}`);
        if (categoryNode) {
          categoryNode.children.push(fileNode);
          this.contextTree.nodes.set(nodeId, fileNode);
        }
      }
    }
    
    // Save the tree structure
    await this.saveContextTree(this.contextTree);
    
    return `Context tree built with ${this.contextTree.nodes.size} nodes`;
  }

  async searchContextTree(query) {
    // Load the tree
    const tree = await this.loadContextTree();
    
    if (!tree) {
      return 'Context tree not found. Please build the tree first.';
    }
    
    // Simple search implementation
    const results = [];
    
    for (const [key, node] of tree.nodes) {
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
      output += `  Type: ${result.metadata.type}\n\n`;
    }
    
    return output;
  }

  async addDocumentToTree(filePath, category = 'documentation') {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      // Load existing tree
      let tree = await this.loadContextTree();
      
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
          nodes: new Map()
        };
        
        tree.nodes.set('root', tree.root);
      }
      
      // Check if category exists, create if not
      const categoryId = `category-${category}`;
      let categoryNode = tree.nodes.get(categoryId);
      
      if (!categoryNode) {
        categoryNode = {
          id: categoryId,
          title: this.capitalize(category),
          content: `${this.capitalize(category)} files and resources`,
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
      
      const fileNode = {
        id: nodeId,
        title: fileName,
        content: content.substring(0, 500) + (content.length > 500 ? '...' : ''),
        filePath: filePath,
        children: [],
        metadata: {
          type: 'file',
          priority: 2,
          lastUpdated: new Date((await fs.stat(filePath)).mtime)
        }
      };
      
      // Add to category
      categoryNode.children.push(fileNode);
      tree.nodes.set(nodeId, fileNode);
      
      // Save updated tree
      await this.saveContextTree(tree);
      
      return `Document "${fileName}" added to category "${category}"`;
    } catch (error) {
      return `Error adding document: ${error.message}`;
    }
  }

  async saveContextTree(tree) {
    const treePath = path.join(process.cwd(), '.pagia', 'context-tree.json');
    
    // Ensure .pagia directory exists
    await fs.mkdir(path.dirname(treePath), { recursive: true });
    
    // Convert Map to object for serialization
    const serializableTree = {
      ...tree,
      nodes: Array.from(tree.nodes.entries())
    };
    
    await fs.writeFile(treePath, JSON.stringify(serializableTree, null, 2));
  }

  async loadContextTree() {
    const treePath = path.join(process.cwd(), '.pagia', 'context-tree.json');
    
    try {
      const data = await fs.readFile(treePath, 'utf-8');
      const parsed = JSON.parse(data);
      
      // Convert back to Map
      const tree = {
        ...parsed,
        nodes: new Map(parsed.nodes)
      };
      
      return tree;
    } catch (error) {
      return null;
    }
  }

  capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}

// Test the functionality
async function test() {
  console.log('Testing ContextCuration class...\n');
  
  const cc = new ContextCuration();
  
  // Test building context tree
  console.log('1. Building context tree...');
  const result = await cc.buildContextTree('.');
  console.log(result + '\n');
  
  // Test searching
  console.log('2. Searching for "context"...');
  const searchResult = await cc.searchContextTree('context');
  console.log(searchResult);
  
  console.log('Context curation tests completed!');
}

test().catch(console.error);