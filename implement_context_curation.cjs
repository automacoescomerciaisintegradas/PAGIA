const fs = require('fs');
const path = require('path');

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

  buildContextTreeSync(sourceDir = '.', patterns = ['./*.md', './*.txt', './*.ts', './*.js']) {
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
    
    // For simplicity, we'll just scan the root directory
    const files = fs.readdirSync(sourceDir);
    
    for (const file of files) {
      const filePath = path.join(sourceDir, file);
      const stat = fs.statSync(filePath);
      
      if (stat.isFile()) {
        // Check if file matches our patterns
        const matchesPattern = patterns.some(pattern => {
          const regex = new RegExp(pattern.replace(/\*/g, '.*').replace(/\./g, '\\.'));
          return regex.test(file);
        });
        
        if (matchesPattern) {
          const content = fs.readFileSync(filePath, 'utf-8');
          
          // Determine category based on file extension
          let category = 'code';
          if (file.endsWith('.md')) category = 'documentation';
          else if (file.includes('.test.') || file.includes('.spec.')) category = 'tests';
          else if (file.includes('config') || file.includes('.json') || file.includes('.yaml') || file.includes('.yml')) category = 'config';
          
          const nodeId = `file-${file.replace(/[\/\\]/g, '-')}`;
          
          const fileNode = {
            id: nodeId,
            title: file,
            content: content.substring(0, 500) + (content.length > 500 ? '...' : ''), // Truncate long content
            filePath: filePath,
            children: [],
            metadata: {
              type: 'file',
              priority: 2,
              lastUpdated: stat.mtime
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
    }
    
    // Save the tree structure
    this.saveContextTreeSync(this.contextTree);
    
    return `Context tree built with ${this.contextTree.nodes.size} nodes`;
  }

  searchContextTreeSync(query) {
    // Load the tree
    const tree = this.loadContextTreeSync();
    
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

  addDocumentToTreeSync(filePath, category = 'documentation') {
    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const fileName = path.basename(filePath);
      
      // Load existing tree
      let tree = this.loadContextTreeSync();
      
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
          lastUpdated: fs.statSync(filePath).mtime
        }
      };
      
      // Add to category
      categoryNode.children.push(fileNode);
      tree.nodes.set(nodeId, fileNode);
      
      // Save updated tree
      this.saveContextTreeSync(tree);
      
      return `Document "${fileName}" added to category "${category}"`;
    } catch (error) {
      return `Error adding document: ${error.message}`;
    }
  }

  saveContextTreeSync(tree) {
    const treePath = path.join(process.cwd(), '.pagia', 'context-tree.json');
    
    // Ensure .pagia directory exists
    if (!fs.existsSync(path.dirname(treePath))) {
      fs.mkdirSync(path.dirname(treePath), { recursive: true });
    }
    
    // Convert Map to object for serialization
    const serializableTree = {
      ...tree,
      nodes: Array.from(tree.nodes.entries())
    };
    
    fs.writeFileSync(treePath, JSON.stringify(serializableTree, null, 2));
  }

  loadContextTreeSync() {
    const treePath = path.join(process.cwd(), '.pagia', 'context-tree.json');
    
    try {
      if (!fs.existsSync(treePath)) {
        return null;
      }
      
      const data = fs.readFileSync(treePath, 'utf-8');
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

// Test the functionality and save results to a file
function testAndSaveResults() {
  const results = [];
  
  results.push('Testing ContextCuration class...\n');
  
  const cc = new ContextCuration();
  
  // Test building context tree
  results.push('1. Building context tree...');
  const result = cc.buildContextTreeSync('.');
  results.push(result + '\n');
  
  // Test searching
  results.push('2. Searching for "context"...');
  const searchResult = cc.searchContextTreeSync('context');
  results.push(searchResult);
  
  results.push('\nContext curation tests completed!');
  
  // Write results to file
  fs.writeFileSync('context_curation_results.txt', results.join('\n'));
}

testAndSaveResults();