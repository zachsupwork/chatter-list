
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface PostCallAnalysisData {
  type: "string";
  name: string;
  description: string;
  examples?: string[];
}

interface PronunciationDictionary {
  word: string;
  alphabet: "ipa" | "cmu";
  phoneme: string;
}

interface AgentForm {
  response_engine: {
    type: "retell-llm";
    llm_id: string;
  };
  voice_id: string;
  agent_name?: string;
  voice_model?: "eleven_turbo_v2" | "eleven_flash_v2" | "eleven_turbo_v2_5" | "eleven_flash_v2_5" | "eleven_multilingual_v2" | "Play3.0-mini" | "PlayDialog" | null;
  fallback_voice_ids?: string[] | null;
  voice_temperature?: number;
  voice_speed?: number;
  volume?: number;
  responsiveness?: number;
  interruption_sensitivity?: number;
  enable_backchannel?: boolean;
  backchannel_frequency?: number;
  backchannel_words?: string[] | null;
  reminder_trigger_ms?: number;
  reminder_max_count?: number;
  ambient_sound?: "coffee-shop" | "convention-hall" | "summer-outdoor" | "mountain-outdoor" | "static-noise" | "call-center" | null;
  ambient_sound_volume?: number;
  language?: string;
  webhook_url?: string | null;
  boosted_keywords?: string[] | null;
  enable_transcription_formatting?: boolean;
  opt_out_sensitive_data_storage?: boolean;
  pronunciation_dictionary?: PronunciationDictionary[] | null;
  normalize_for_speech?: boolean;
  end_call_after_silence_ms?: number;
  max_call_duration_ms?: number;
  enable_voicemail_detection?: boolean;
  voicemail_message?: string;
  voicemail_detection_timeout_ms?: number;
  post_call_analysis_data?: PostCallAnalysisData[] | null;
  begin_message_delay_ms?: number;
  ring_duration_ms?: number;
}

const languages = [
  "en-US", "en-IN", "en-GB", "de-DE", "es-ES", "es-419", "hi-IN", "ja-JP",
  "pt-PT", "pt-BR", "fr-FR", "zh-CN", "ru-RU", "it-IT", "ko-KR", "nl-NL",
  "pl-PL", "tr-TR", "vi-VN", "multi"
];

const voiceModels = [
  "eleven_turbo_v2", "eleven_flash_v2", "eleven_turbo_v2_5", "eleven_flash_v2_5",
  "eleven_multilingual_v2", "Play3.0-mini", "PlayDialog"
];

const ambientSounds = [
  "coffee-shop", "convention-hall", "summer-outdoor", "mountain-outdoor",
  "static-noise", "call-center"
];

export default function CreateAgent() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [formData, setFormData] = useState<AgentForm>({
    response_engine: {
      type: "retell-llm",
      llm_id: ""
    },
    voice_id: "",
    agent_name: "",
    enable_backchannel: false,
    enable_transcription_formatting: true,
    opt_out_sensitive_data_storage: false,
    normalize_for_speech: true,
    enable_voicemail_detection: false
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const { data: { RETELL_API_KEY } } = await supabase.functions.invoke(
        'retell-calls',
        {
          body: {
            action: 'getApiKey'
          }
        }
      );

      const response = await fetch("https://api.retellai.com/create-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${RETELL_API_KEY}`
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create agent");
      }

      toast({
        title: "Success",
        description: `Agent created with ID: ${data.agent_id}`,
      });

      navigate("/");
    } catch (error: any) {
      console.error("Error creating agent:", error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to create agent",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Create Agent</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <Label>LLM ID</Label>
                <Input
                  required
                  value={formData.response_engine.llm_id}
                  onChange={(e) => setFormData(prev => ({
                    ...prev,
                    response_engine: { ...prev.response_engine, llm_id: e.target.value }
                  }))}
                  placeholder="Enter LLM ID"
                />
              </div>

              <div>
                <Label>Voice ID</Label>
                <Input
                  required
                  value={formData.voice_id}
                  onChange={(e) => setFormData(prev => ({ ...prev, voice_id: e.target.value }))}
                  placeholder="e.g., 11labs-Adrian"
                />
              </div>

              <div>
                <Label>Agent Name</Label>
                <Input
                  value={formData.agent_name || ""}
                  onChange={(e) => setFormData(prev => ({ ...prev, agent_name: e.target.value }))}
                  placeholder="Enter agent name"
                />
              </div>

              <div>
                <Label>Voice Model</Label>
                <Select
                  value={formData.voice_model || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, voice_model: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select voice model" />
                  </SelectTrigger>
                  <SelectContent>
                    {voiceModels.map((model) => (
                      <SelectItem key={model} value={model}>
                        {model}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label>Language</Label>
                <Select
                  value={formData.language || "en-US"}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, language: value }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select language" />
                  </SelectTrigger>
                  <SelectContent>
                    {languages.map((lang) => (
                      <SelectItem key={lang} value={lang}>
                        {lang}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Voice Settings */}
              <div>
                <Label>Voice Temperature (0-2)</Label>
                <Input
                  type="number"
                  min="0"
                  max="2"
                  step="0.1"
                  value={formData.voice_temperature || 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, voice_temperature: parseFloat(e.target.value) }))}
                />
              </div>

              <div>
                <Label>Voice Speed (0.5-2)</Label>
                <Input
                  type="number"
                  min="0.5"
                  max="2"
                  step="0.1"
                  value={formData.voice_speed || 1}
                  onChange={(e) => setFormData(prev => ({ ...prev, voice_speed: parseFloat(e.target.value) }))}
                />
              </div>

              {/* Ambient Sound */}
              <div>
                <Label>Ambient Sound</Label>
                <Select
                  value={formData.ambient_sound || ""}
                  onValueChange={(value) => setFormData(prev => ({ ...prev, ambient_sound: value as any }))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select ambient sound" />
                  </SelectTrigger>
                  <SelectContent>
                    {ambientSounds.map((sound) => (
                      <SelectItem key={sound} value={sound}>
                        {sound}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Toggle Settings */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <Label>Enable Backchannel</Label>
                  <Switch
                    checked={formData.enable_backchannel}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_backchannel: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Enable Transcription Formatting</Label>
                  <Switch
                    checked={formData.enable_transcription_formatting}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_transcription_formatting: checked }))}
                  />
                </div>

                <div className="flex items-center justify-between">
                  <Label>Enable Voicemail Detection</Label>
                  <Switch
                    checked={formData.enable_voicemail_detection}
                    onCheckedChange={(checked) => setFormData(prev => ({ ...prev, enable_voicemail_detection: checked }))}
                  />
                </div>
              </div>
            </div>

            {/* Submit Buttons */}
            <div className="flex gap-4">
              <Button type="submit" disabled={isLoading}>
                {isLoading ? "Creating..." : "Create Agent"}
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/")}>
                Cancel
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  </form>;
};
