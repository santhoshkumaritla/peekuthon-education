import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Workflow, 
  Brain, 
  Loader2, 
  Download, 
  Copy, 
  RefreshCw,
  Target,
  Lightbulb,
  Zap
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY || "";
const GEMINI_MODEL = "gemini-2.0-flash";
const GEMINI_API_URL = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`;

interface FlowchartNode {
  id: string;
  label: string;
  level: number;
}

interface FlowchartEdge {
  from: string;
  to: string;
}

interface FlowchartData {
  nodes: FlowchartNode[];
  edges: FlowchartEdge[];
  explanation: string;
  rawContent: string;
}

const generateContent = async (prompt: string): Promise<string> => {
  const response = await fetch(GEMINI_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      contents: [{
        parts: [{ text: prompt }]
      }]
    })
  });

  if (!response.ok) {
    throw new Error('Failed to generate content');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
};

const FlowchartGenerator = () => {
  const [topic, setTopic] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [flowchartData, setFlowchartData] = useState<FlowchartData | null>(null);
  const [selectedTab, setSelectedTab] = useState('visual');
  const { toast } = useToast();

  const generateFlowchart = async () => {
    if (!topic.trim()) {
      toast({
        title: "Error",
        description: "Please enter a topic to generate a flowchart",
        variant: "destructive"
      });
      return;
    }

    setIsGenerating(true);
    try {
      const prompt = `Create a detailed vertical flowchart for the topic "${topic}". 

Use EXACTLY this format:
1. List steps as arrows between nodes using format: "Node A -> Node B"
2. After all nodes, write explanation starting with "Explanation:"

Requirements:
- Create 5-8 logical steps for the topic
- Use clear, concise node names
- Make it educational and informative
- Ensure logical flow from start to finish

Example format:
Data Collection -> Data Preprocessing
Data Preprocessing -> Model Selection
Model Selection -> Training and Validation
Explanation: This flowchart shows the machine learning workflow...

Your response must contain ONLY nodes and explanation in this format. No extra text.`;

      const response = await generateContent(prompt);
      
      // Parse the response
      const parsedData = parseFlowchartContent(response);
      setFlowchartData(parsedData);
      
      toast({
        title: "Success!",
        description: `Generated flowchart for "${topic}"`,
      });
    } catch (error) {
      console.error('Error generating flowchart:', error);
      toast({
        title: "Error",
        description: "Failed to generate flowchart. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsGenerating(false);
    }
  };

  const parseFlowchartContent = (content: string): FlowchartData => {
    const nodes: FlowchartNode[] = [];
    const edges: FlowchartEdge[] = [];
    let explanation = '';
    
    const lines = content.split('\n').map(line => line.trim()).filter(line => line);
    
    let explanationFound = false;
    const nodeMap = new Map<string, number>();
    let nodeCounter = 0;
    
    for (const line of lines) {
      if (line.toLowerCase().startsWith('explanation:')) {
        explanationFound = true;
        explanation = line.substring('explanation:'.length).trim();
      } else if (explanationFound) {
        explanation += ' ' + line;
      } else if (line.includes('->')) {
        const [source, target] = line.split('->').map(s => s.trim());
        
        if (source && target) {
          // Add source node if not exists
          if (!nodeMap.has(source)) {
            nodeMap.set(source, nodeCounter);
            nodes.push({
              id: `node-${nodeCounter}`,
              label: source,
              level: nodeCounter
            });
            nodeCounter++;
          }
          
          // Add target node if not exists
          if (!nodeMap.has(target)) {
            nodeMap.set(target, nodeCounter);
            nodes.push({
              id: `node-${nodeCounter}`,
              label: target,
              level: nodeCounter
            });
            nodeCounter++;
          }
          
          edges.push({
            from: source,
            to: target
          });
        }
      }
    }
    
    return {
      nodes,
      edges,
      explanation: explanation.trim(),
      rawContent: content
    };
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied!",
      description: "Content copied to clipboard",
    });
  };

  const downloadFlowchart = () => {
    if (!flowchartData) return;
    
    const content = `Flowchart for: ${topic}\n\n` +
      flowchartData.edges.map(edge => `${edge.from} -> ${edge.to}`).join('\n') +
      `\n\nExplanation:\n${flowchartData.explanation}`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `flowchart-${topic.replace(/\s+/g, '-').toLowerCase()}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    toast({
      title: "Downloaded!",
      description: "Flowchart saved to your device",
    });
  };

  const downloadFlowchartAsImage = async () => {
    if (!flowchartData) return;
    
    // Get only the flowchart visualization (not tabs, buttons, etc.)
    const element = document.getElementById('flowchart-visual');
    if (!element) return;

    try {
      // Dynamically import html2canvas
      const html2canvas = (await import('html2canvas')).default;
      
      const canvas = await html2canvas(element, {
        backgroundColor: '#ffffff',
        scale: 2,
        logging: false,
        useCORS: true,
        allowTaint: true,
        width: element.scrollWidth,
        height: element.scrollHeight,
      });
      
      const url = canvas.toDataURL('image/png');
      const a = document.createElement('a');
      a.href = url;
      a.download = `flowchart-${topic.replace(/\s+/g, '-').toLowerCase()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      
      toast({
        title: "Downloaded!",
        description: "Flowchart image saved to your device",
      });
    } catch (error) {
      console.error('Error generating image:', error);
      toast({
        title: "Error",
        description: "Failed to download image. Please try again.",
        variant: "destructive"
      });
    }
  };

  const resetFlowchart = () => {
    setTopic('');
    setFlowchartData(null);
    setSelectedTab('visual');
  };

  return (
    <div className="container mx-auto p-6 max-w-6xl">
      {/* Header */}
      <div className="text-center space-y-4 mb-8">
        <div className="w-16 h-16 mx-auto rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
          <Workflow className="h-8 w-8 text-white" />
        </div>
        <h1 className="text-4xl font-bold text-foreground">Flowchart Generator</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Input Section */}
        <div className="lg:col-span-1 space-y-6">
          {/* Topic Input */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Generate Flowchart
              </CardTitle>
              <CardDescription>
                Enter a topic and let AI create a detailed flowchart
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Input
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                  placeholder="e.g., Machine Learning Workflow"
                  className="text-lg"
                  onKeyPress={(e) => e.key === 'Enter' && generateFlowchart()}
                />
                <Button
                  onClick={generateFlowchart}
                  disabled={isGenerating || !topic.trim()}
                  className="w-full"
                  size="lg"
                >
                  {isGenerating ? (
                    <>
                      <Loader2 className="h-5 w-5 mr-2 animate-spin" />
                      Generating...
                    </>
                  ) : (
                    <>
                      <Zap className="h-5 w-5 mr-2" />
                      Generate Flowchart
                    </>
                  )}
                </Button>
              </div>

              {/* Actions */}
              {flowchartData && (
                <div className="space-y-2">
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={downloadFlowchartAsImage}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download as Image
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={downloadFlowchart}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Download as Text
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={resetFlowchart}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Generate New
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Features */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Brain className="h-5 w-5" />
                What I Can Create
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">📊</Badge>
                  <span className="text-sm">Process workflows</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">🔀</Badge>
                  <span className="text-sm">Decision trees</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">📈</Badge>
                  <span className="text-sm">Step-by-step guides</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">🎯</Badge>
                  <span className="text-sm">Problem-solving flows</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="text-xs">⚡</Badge>
                  <span className="text-sm">Learning paths</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Flowchart Display */}
        <div className="lg:col-span-2">
          {!flowchartData ? (
            <Card className="h-96 flex items-center justify-center">
              <div className="text-center space-y-4">
                <Workflow className="h-16 w-16 mx-auto text-muted-foreground" />
                <div>
                  <h3 className="text-lg font-semibold">No Flowchart Yet</h3>
                  <p className="text-muted-foreground">
                    Enter a topic above to generate your first flowchart
                  </p>
                </div>
              </div>
            </Card>
          ) : (
            <Card id="flowchart-container">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>Flowchart: {topic}</span>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => copyToClipboard(flowchartData.rawContent)}
                    >
                      <Copy className="h-4 w-4 mr-2" />
                      Copy
                    </Button>
                  </div>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <Tabs value={selectedTab} onValueChange={setSelectedTab}>
                  <TabsList className="grid w-full grid-cols-3">
                    <TabsTrigger value="visual">Visual</TabsTrigger>
                    <TabsTrigger value="text">Text</TabsTrigger>
                    <TabsTrigger value="explanation">Explanation</TabsTrigger>
                  </TabsList>

                  {/* Visual Tab */}
                  <TabsContent value="visual" className="mt-6">
                    <div className="mb-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-800 mb-2">Visual Flowchart</h4>
                      <p className="text-sm text-blue-700">
                        This flowchart shows the step-by-step process for "{topic}". Each box represents a step, 
                        and the arrows show the flow direction from top to bottom.
                      </p>
                    </div>
                    <div id="flowchart-visual" className="space-y-6 p-8 bg-white rounded-lg">
                      <div className="text-center mb-4">
                        <h3 className="text-xl font-bold text-blue-900">{topic}</h3>
                      </div>
                      {flowchartData.nodes.map((node, index) => (
                        <div key={node.id} className="flex flex-col items-center relative">
                          {/* Step Number */}
                          <div className="absolute -left-8 top-1/2 transform -translate-y-1/2 w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs font-bold">
                            {index + 1}
                          </div>
                          
                          {/* Node */}
                          <div className="bg-blue-100 border-2 border-blue-300 rounded-lg px-6 py-3 min-w-56 text-center shadow-sm hover:shadow-md transition-shadow">
                            <span className="font-medium text-blue-800 text-sm">{node.label}</span>
                          </div>
                          
                          {/* Down Arrow */}
                          {index < flowchartData.nodes.length - 1 && (
                            <div className="my-2 flex flex-col items-center">
                              <div className="w-0.5 h-8 bg-blue-400"></div>
                              <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-blue-400"></div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Text Tab */}
                  <TabsContent value="text" className="mt-6">
                    <div className="space-y-3">
                      <h4 className="font-semibold">Flowchart Steps:</h4>
                      {flowchartData.edges.map((edge, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm">
                          <Badge variant="outline" className="text-xs">
                            {index + 1}
                          </Badge>
                          <span className="font-medium">{edge.from}</span>
                          <div className="flex flex-col items-center">
                            <div className="w-0.5 h-4 bg-blue-400"></div>
                            <div className="w-0 h-0 border-l-2 border-r-2 border-t-2 border-l-transparent border-r-transparent border-t-blue-400"></div>
                          </div>
                          <span className="font-medium">{edge.to}</span>
                        </div>
                      ))}
                    </div>
                  </TabsContent>

                  {/* Explanation Tab */}
                  <TabsContent value="explanation" className="mt-6">
                    <div className="space-y-4">
                      <h4 className="font-semibold">Explanation:</h4>
                      <div className="bg-muted p-4 rounded-lg">
                        <p className="text-sm leading-relaxed">
                          {flowchartData.explanation || 'No explanation provided.'}
                        </p>
                      </div>
                    </div>
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
};

export default FlowchartGenerator;
