// components/agents-ui/agent-audio-visualizer-fluid.tsx
'use client';

import type { ComponentProps } from 'react';
import type { AgentState } from '@livekit/components-react';
import type { LocalAudioTrack, RemoteAudioTrack, TrackReferenceOrPlaceholder } from 'livekit-client';
import { ReactShaderToy } from '@/components/agents-ui/react-shader-toy';
import { useAgentAudioVisualizerCustom } from '@/hooks/agents-ui/use-agent-audio-visualizer-custom';
import { cn } from '@/lib/shadcn/utils';
import { hexToRgb } from '@/lib/color';

export interface AgentAudioVisualizerFluidProps extends ComponentProps<'div'> {
  size?: 'icon' | 'sm' | 'md' | 'lg' | 'xl';
  state?: AgentState;
  color?: `#${string}`;
  audioTrack?: LocalAudioTrack | RemoteAudioTrack | TrackReferenceOrPlaceholder;
}

const FLUID_SHADER = /* glsl */ `
uniform vec3 uColor;
uniform float uIntensity;
uniform float uSpeed;

void mainImage(out vec4 fragColor, in vec2 fragCoord) {
    vec2 uv = fragCoord / iResolution.xy;
    vec2 pos = uv - 0.5;
    float t = iTime * uSpeed;
    
    // Fluid distortion
    float n1 = sin(pos.x * 5.0 + t) * cos(pos.y * 5.0 - t * 0.7) * uIntensity;
    float n2 = cos(pos.x * 12.0 - t * 1.3) * sin(pos.y * 12.0 + t * 0.9) * uIntensity * 0.6;
    float n = (n1 + n2) * 0.5;
    
    vec3 col = uColor * (0.3 + 0.7 * smoothstep(-0.3, 0.3, n + 0.5));
    col = mix(col, vec3(0.0), 0.2);
    
    fragColor = vec4(col, 1.0);
}
`;

const sizeClasses = {
  icon: 'size-[24px]',
  sm: 'size-[56px]',
  md: 'size-[112px]',
  lg: 'size-[224px]',
  xl: 'size-[448px]',
} as const;

export function AgentAudioVisualizerFluid({
  size = 'lg',
  state = 'connecting',
  color = '#002cf2',
  audioTrack,
  className,
  ...props
}: AgentAudioVisualizerFluidProps) {
  const { intensity, speed } = useAgentAudioVisualizerCustom(state, audioTrack);

  return (
    <ReactShaderToy
      fs={FLUID_SHADER}
      uniforms={{
        uColor: { type: '3fv', value: hexToRgb(color) },
        uIntensity: { type: '1f', value: intensity },
        uSpeed: { type: '1f', value: speed },
      }}
      className={cn(sizeClasses[size], 'rounded-full overflow-hidden', className)}
      {...props}
    />
  );
}