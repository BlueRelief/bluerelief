"use client";

import { Logo } from "@/components/logo";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Check, AlertCircle, Info, XCircle, Copy, Download, CheckCheck } from "lucide-react";
import { useState } from "react";
import React from "react";
import { toast } from "sonner";

export default function DesignSystemPage() {
  const handleDownloadLogo = (format: 'png' | 'svg') => {
    const link = document.createElement('a');
    link.href = `/bluerelief-logo.${format}`;
    link.download = `bluerelief-logo.${format}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success(`Logo ${format.toUpperCase()} downloaded`);
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="fixed top-6 right-6 z-50">
        <ThemeSwitcher />
      </div>

      <div className="container mx-auto px-6 py-12 max-w-7xl">
        <div className="space-y-16">
          {/* Header */}
          <div className="text-center space-y-6">
            <div className="flex justify-center">
              <Logo size="xl" />
            </div>
            <div>
              <h1 className="text-4xl font-bold tracking-tight">BlueRelief Design System</h1>
              <p className="text-muted-foreground mt-2 text-lg">
                A comprehensive guide to the BlueRelief visual language and components
              </p>
            </div>
          </div>

          {/* Brand */}
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Brand</h2>
              <p className="text-muted-foreground">Logo variations and usage guidelines</p>
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Logo Downloads</CardTitle>
                <CardDescription>Download logo assets in different formats</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button onClick={() => handleDownloadLogo('png')} variant="outline">
                    <Download />
                    Download PNG
                  </Button>
                  <Button onClick={() => handleDownloadLogo('svg')} variant="outline">
                    <Download />
                    Download SVG
                  </Button>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Logo Sizes</CardTitle>
                <CardDescription>Available logo sizes for different contexts</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-8 items-end">
                  <div className="space-y-2 flex flex-col items-center">
                    <Logo size="icon" />
                    <span className="text-xs text-muted-foreground">icon (16px)</span>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <Logo size="sm" />
                    <span className="text-xs text-muted-foreground">sm (24px)</span>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <Logo size="default" />
                    <span className="text-xs text-muted-foreground">default (40px)</span>
                  </div>
                  <div className="space-y-2 flex flex-col items-center">
                    <Logo size="xl" />
                    <span className="text-xs text-muted-foreground">xl (64px)</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Colors - Base */}
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Colors</h2>
              <p className="text-muted-foreground">Core color palette and semantic tokens</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Base Colors</CardTitle>
                <CardDescription>Primary palette used throughout the application</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ColorSwatch name="Background" cssVar="--background" />
                  <ColorSwatch name="Foreground" cssVar="--foreground" />
                  <ColorSwatch name="Primary" cssVar="--primary" />
                  <ColorSwatch name="Primary Foreground" cssVar="--primary-foreground" bgVar="--primary" />
                  <ColorSwatch name="Secondary" cssVar="--secondary" />
                  <ColorSwatch name="Secondary Foreground" cssVar="--secondary-foreground" bgVar="--secondary" />
                  <ColorSwatch name="Accent" cssVar="--accent" />
                  <ColorSwatch name="Accent Foreground" cssVar="--accent-foreground" bgVar="--accent" />
                  <ColorSwatch name="Muted" cssVar="--muted" />
                  <ColorSwatch name="Muted Foreground" cssVar="--muted-foreground" bgVar="--muted" />
                  <ColorSwatch name="Destructive" cssVar="--destructive" />
                  <ColorSwatch name="Destructive Foreground" cssVar="--destructive-foreground" bgVar="--destructive" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>UI Colors</CardTitle>
                <CardDescription>Colors for borders, inputs, and other UI elements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                  <ColorSwatch name="Card" cssVar="--card" />
                  <ColorSwatch name="Popover" cssVar="--popover" />
                  <ColorSwatch name="Border" cssVar="--border" />
                  <ColorSwatch name="Input" cssVar="--input" />
                  <ColorSwatch name="Ring" cssVar="--ring" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Semantic Colors</CardTitle>
                <CardDescription>Status and feedback colors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Success</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <ColorSwatch name="50" cssVar="--success-50" compact />
                      <ColorSwatch name="100" cssVar="--success-100" compact />
                      <ColorSwatch name="300" cssVar="--success-300" compact />
                      <ColorSwatch name="600" cssVar="--success-600" compact />
                      <ColorSwatch name="800" cssVar="--success-800" compact />
                      <ColorSwatch name="900" cssVar="--success-900" compact />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Warning</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <ColorSwatch name="50" cssVar="--warning-50" compact />
                      <ColorSwatch name="100" cssVar="--warning-100" compact />
                      <ColorSwatch name="300" cssVar="--warning-300" compact />
                      <ColorSwatch name="500" cssVar="--warning-500" compact />
                      <ColorSwatch name="600" cssVar="--warning-600" compact />
                      <ColorSwatch name="900" cssVar="--warning-900" compact />
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Info</h4>
                    <div className="grid grid-cols-3 md:grid-cols-6 gap-4">
                      <ColorSwatch name="50" cssVar="--info-50" compact />
                      <ColorSwatch name="100" cssVar="--info-100" compact />
                      <ColorSwatch name="300" cssVar="--info-300" compact />
                      <ColorSwatch name="600" cssVar="--info-600" compact />
                      <ColorSwatch name="800" cssVar="--info-800" compact />
                      <ColorSwatch name="900" cssVar="--info-900" compact />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Severity Badge Colors</CardTitle>
                <CardDescription>Specific colors for alert severity levels (click to copy)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  <SeveritySwatch name="Critical" bgVar="--severity-critical-bg" textVar="--severity-critical-text" />
                  <SeveritySwatch name="High" bgVar="--severity-high-bg" textVar="--severity-high-text" />
                  <SeveritySwatch name="Medium" bgVar="--severity-medium-bg" textVar="--severity-medium-text" />
                  <SeveritySwatch name="Low" bgVar="--severity-low-bg" textVar="--severity-low-text" />
                  <SeveritySwatch name="Info" bgVar="--severity-info-bg" textVar="--severity-info-text" />
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Typography */}
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Typography</h2>
              <p className="text-muted-foreground">Type scale and font usage</p>
            </div>
            <Card>
              <CardHeader>
                <CardTitle>Type Scale</CardTitle>
                <CardDescription>Font size hierarchy using Lato</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div className="border-b pb-4">
                    <p className="text-4xl font-bold">Heading 1</p>
                    <p className="text-sm text-muted-foreground mt-1">text-4xl font-bold</p>
                  </div>
                  <div className="border-b pb-4">
                    <p className="text-3xl font-bold">Heading 2</p>
                    <p className="text-sm text-muted-foreground mt-1">text-3xl font-bold</p>
                  </div>
                  <div className="border-b pb-4">
                    <p className="text-2xl font-bold">Heading 3</p>
                    <p className="text-sm text-muted-foreground mt-1">text-2xl font-bold</p>
                  </div>
                  <div className="border-b pb-4">
                    <p className="text-xl font-semibold">Heading 4</p>
                    <p className="text-sm text-muted-foreground mt-1">text-xl font-semibold</p>
                  </div>
                  <div className="border-b pb-4">
                    <p className="text-lg font-medium">Large Text</p>
                    <p className="text-sm text-muted-foreground mt-1">text-lg font-medium</p>
                  </div>
                  <div className="border-b pb-4">
                    <p className="text-base">Body Text</p>
                    <p className="text-sm text-muted-foreground mt-1">text-base</p>
                  </div>
                  <div className="border-b pb-4">
                    <p className="text-sm">Small Text</p>
                    <p className="text-sm text-muted-foreground mt-1">text-sm</p>
                  </div>
                  <div>
                    <p className="text-xs">Extra Small Text</p>
                    <p className="text-sm text-muted-foreground mt-1">text-xs</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Font Weights</CardTitle>
                <CardDescription>Available font weight variations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-light text-lg">Light (300)</span>
                    <code className="text-xs">font-light</code>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-normal text-lg">Normal (400)</span>
                    <code className="text-xs">font-normal</code>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-medium text-lg">Medium (500)</span>
                    <code className="text-xs">font-medium</code>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-semibold text-lg">Semibold (600)</span>
                    <code className="text-xs">font-semibold</code>
                  </div>
                  <div className="flex items-center justify-between border-b pb-3">
                    <span className="font-bold text-lg">Bold (700)</span>
                    <code className="text-xs">font-bold</code>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="font-black text-lg">Black (900)</span>
                    <code className="text-xs">font-black</code>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Components */}
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Components</h2>
              <p className="text-muted-foreground">UI component examples and variations</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Buttons</CardTitle>
                <CardDescription>Button variants and sizes</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Variants</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button variant="default">Default</Button>
                      <Button variant="secondary">Secondary</Button>
                      <Button variant="destructive">Destructive</Button>
                      <Button variant="outline">Outline</Button>
                      <Button variant="ghost">Ghost</Button>
                      <Button variant="link">Link</Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">Sizes</h4>
                    <div className="flex flex-wrap items-center gap-3">
                      <Button size="sm">Small</Button>
                      <Button size="default">Default</Button>
                      <Button size="lg">Large</Button>
                    </div>
                  </div>
                  <div>
                    <h4 className="font-semibold mb-3 text-sm">With Icons</h4>
                    <div className="flex flex-wrap gap-3">
                      <Button>
                        <Check />
                        With Icon
                      </Button>
                      <Button variant="outline">
                        <AlertCircle />
                        Alert
                      </Button>
                      <Button size="icon">
                        <Info />
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Badges</CardTitle>
                <CardDescription>Badge variants for labels and status indicators</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Badge variant="default">Default</Badge>
                  <Badge variant="secondary">Secondary</Badge>
                  <Badge variant="destructive">Destructive</Badge>
                  <Badge variant="outline">Outline</Badge>
                  <Badge variant="default">
                    <Check />
                    With Icon
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Cards</CardTitle>
                <CardDescription>Container component for grouping content</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader>
                      <CardTitle>Card Title</CardTitle>
                      <CardDescription>Card description goes here</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">This is an example of a card component with header and content sections.</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle>Another Card</CardTitle>
                      <CardDescription>With different content</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <Check className="size-4 text-primary" />
                          <span className="text-sm">Feature one</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Check className="size-4 text-primary" />
                          <span className="text-sm">Feature two</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Spacing & Shadows */}
          <section className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Spacing & Effects</h2>
              <p className="text-muted-foreground">Spacing scale and shadow utilities</p>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Shadows</CardTitle>
                <CardDescription>Elevation and depth using shadow utilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
                  <ShadowExample name="2xs" shadow="shadow-2xs" />
                  <ShadowExample name="xs" shadow="shadow-xs" />
                  <ShadowExample name="sm" shadow="shadow-sm" />
                  <ShadowExample name="md" shadow="shadow-md" />
                  <ShadowExample name="lg" shadow="shadow-lg" />
                  <ShadowExample name="xl" shadow="shadow-xl" />
                  <ShadowExample name="2xl" shadow="shadow-2xl" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Border Radius</CardTitle>
                <CardDescription>Rounded corner utilities</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                  <div className="space-y-2">
                    <div className="h-20 bg-primary rounded-sm" />
                    <p className="text-xs text-center text-muted-foreground">rounded-sm</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 bg-primary rounded-md" />
                    <p className="text-xs text-center text-muted-foreground">rounded-md</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 bg-primary rounded-lg" />
                    <p className="text-xs text-center text-muted-foreground">rounded-lg</p>
                  </div>
                  <div className="space-y-2">
                    <div className="h-20 bg-primary rounded-xl" />
                    <p className="text-xs text-center text-muted-foreground">rounded-xl</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>

          {/* Footer */}
          <div className="text-center py-12 border-t">
            <div className="flex justify-center mb-4">
              <Logo size="md" />
            </div>
            <p className="text-muted-foreground">
              BlueRelief Design System v1.0
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function getComputedHex(element: HTMLElement): string {
  const canvas = document.createElement('canvas');
  canvas.width = 1;
  canvas.height = 1;
  const ctx = canvas.getContext('2d');
  if (!ctx) return '#000000';
  
  const computedStyle = getComputedStyle(element);
  ctx.fillStyle = computedStyle.backgroundColor;
  ctx.fillRect(0, 0, 1, 1);
  
  const data = ctx.getImageData(0, 0, 1, 1).data;
  return '#' + [data[0], data[1], data[2]]
    .map(x => x.toString(16).padStart(2, '0'))
    .join('');
}

function ColorSwatch({ 
  name, 
  cssVar, 
  bgVar, 
  compact = false 
}: { 
  name: string; 
  cssVar: string; 
  bgVar?: string;
  compact?: boolean;
}) {
  const [copied, setCopied] = useState(false);
  const [hexColor, setHexColor] = useState<string>('');
  const swatchRef = React.useRef<HTMLDivElement>(null);
  const backgroundColor = bgVar ? `var(${bgVar})` : `var(${cssVar})`;
  const textColor = bgVar ? `var(${cssVar})` : 'inherit';
  
  React.useEffect(() => {
    if (swatchRef.current) {
      const hex = getComputedHex(swatchRef.current);
      setHexColor(hex);
    }
  }, [cssVar]);
  
  const copyToClipboard = () => {
    navigator.clipboard.writeText(hexColor);
    setCopied(true);
    toast.success(`Copied ${hexColor}`);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-2 group">
      <div 
        ref={swatchRef}
        className={`${compact ? 'h-16' : 'h-24'} rounded-lg border flex items-center justify-center relative overflow-hidden cursor-pointer transition-transform hover:scale-105`}
        style={{ 
          backgroundColor,
          color: textColor
        }}
        onClick={copyToClipboard}
      >
        {!compact && <span className="text-xs font-medium">{name}</span>}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          {copied ? (
            <CheckCheck className="size-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : (
            <Copy className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      <div className="text-xs space-y-0.5">
        <p className="font-medium">{name}</p>
        <p className="text-muted-foreground font-mono text-[10px]">{cssVar}</p>
        <p className="text-primary font-mono font-semibold">{hexColor}</p>
      </div>
    </div>
  );
}

function ShadowExample({ name, shadow }: { name: string; shadow: string }) {
  return (
    <div className="space-y-2">
      <div className={`h-20 bg-card rounded-lg flex items-center justify-center border ${shadow}`}>
        <span className="text-xs font-medium">{name}</span>
      </div>
      <p className="text-xs text-center text-muted-foreground">{shadow}</p>
    </div>
  );
}

function SeveritySwatch({ 
  name, 
  bgVar, 
  textVar 
}: { 
  name: string; 
  bgVar: string; 
  textVar: string;
}) {
  const [copied, setCopied] = useState(false);
  const [hexColors, setHexColors] = useState<{ bg: string; text: string }>({ bg: '', text: '' });
  const bgRef = React.useRef<HTMLDivElement>(null);
  const textRef = React.useRef<HTMLSpanElement>(null);
  
  const getHexFromElement = (element: HTMLElement, property: 'backgroundColor' | 'color'): string => {
    const canvas = document.createElement('canvas');
    canvas.width = 1;
    canvas.height = 1;
    const ctx = canvas.getContext('2d');
    if (!ctx) return '#000000';
    
    const computedStyle = getComputedStyle(element);
    ctx.fillStyle = computedStyle[property];
    ctx.fillRect(0, 0, 1, 1);
    
    const data = ctx.getImageData(0, 0, 1, 1).data;
    return '#' + [data[0], data[1], data[2]]
      .map(x => x.toString(16).padStart(2, '0'))
      .join('');
  };
  
  React.useEffect(() => {
    if (bgRef.current && textRef.current) {
      setHexColors({
        bg: getHexFromElement(bgRef.current, 'backgroundColor'),
        text: getHexFromElement(textRef.current, 'color')
      });
    }
  }, [bgVar, textVar]);
  
  const copyColors = () => {
    const colorInfo = `${name}:\nBackground: ${hexColors.bg}\nText: ${hexColors.text}`;
    navigator.clipboard.writeText(colorInfo);
    setCopied(true);
    toast.success(`Copied ${name} colors`);
    setTimeout(() => setCopied(false), 2000);
  };
  
  return (
    <div className="space-y-2 group">
      <div 
        ref={bgRef}
        className="h-20 rounded-lg border relative overflow-hidden cursor-pointer transition-transform hover:scale-105" 
        style={{ 
          backgroundColor: `var(${bgVar})`,
          color: `var(${textVar})`
        }}
        onClick={copyColors}
      >
        <div className="flex items-center justify-center h-full font-semibold relative z-10">
          <span ref={textRef} style={{ color: `var(${textVar})` }}>{name}</span>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
          {copied ? (
            <CheckCheck className="size-5 opacity-0 group-hover:opacity-100 transition-opacity" />
          ) : (
            <Copy className="size-4 opacity-0 group-hover:opacity-100 transition-opacity" />
          )}
        </div>
      </div>
      <div className="text-xs space-y-1">
        <div className="space-y-0.5">
          <p className="text-center text-muted-foreground font-mono text-[10px]">BG</p>
          <p className="text-center text-primary font-mono font-semibold">{hexColors.bg}</p>
        </div>
        <div className="space-y-0.5">
          <p className="text-center text-muted-foreground font-mono text-[10px]">Text</p>
          <p className="text-center text-primary font-mono font-semibold">{hexColors.text}</p>
        </div>
      </div>
    </div>
  );
}

