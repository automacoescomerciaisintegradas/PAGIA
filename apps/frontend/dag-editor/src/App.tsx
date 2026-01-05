import { ReactFlowProvider } from '@xyflow/react';
import FlowEditor from './components/FlowEditor';
import './App.css';

function App() {
  return (
    <ReactFlowProvider>
      <FlowEditor />
    </ReactFlowProvider>
  );
}

export default App;
