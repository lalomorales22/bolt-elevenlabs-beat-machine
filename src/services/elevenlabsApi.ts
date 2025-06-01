import axios, { AxiosError } from 'axios';

const API_BASE_URL = 'https://api.elevenlabs.io/v1';

export const generateSoundEffect = async (
  apiKey: string,
  text: string,
  durationSeconds?: number,
  promptInfluence: number = 0.3
): Promise<Blob> => {
  try {
    const response = await axios.post(
      `${API_BASE_URL}/sound-generation`,
      {
        text,
        duration_seconds: durationSeconds,
        prompt_influence: promptInfluence
      },
      {
        headers: {
          'xi-api-key': apiKey,
          'Content-Type': 'application/json'
        },
        responseType: 'blob'
      }
    );
    
    return response.data;
  } catch (error) {
    if (axios.isAxiosError(error)) {
      const axiosError = error as AxiosError<any>;
      
      // Handle API-specific error responses
      if (axiosError.response) {
        const status = axiosError.response.status;
        const detail = axiosError.response.data?.detail || axiosError.response.data?.message;
        
        switch (status) {
          case 401:
            throw new Error('Invalid API key. Please check your ElevenLabs API key and try again.');
          case 429:
            throw new Error('Rate limit exceeded. Please try again later.');
          case 400:
            throw new Error(`Invalid request: ${detail || 'Please check your input parameters.'}`);
          default:
            throw new Error(`API Error (${status}): ${detail || 'An unexpected error occurred.'}`);
        }
      }
      
      // Handle network errors
      if (axiosError.request) {
        throw new Error('Network error: Unable to reach the ElevenLabs API. Please check your internet connection.');
      }
    }
    
    // Handle other types of errors
    throw new Error('An unexpected error occurred while generating the sound effect.');
  }
};

export const generateSoundWithPreset = async (
  apiKey: string,
  preset: string
): Promise<Blob> => {
  // Predefined text prompts based on preset
  const presetPrompts: Record<string, string> = {
    kick: "Deep punchy kick drum with strong low end",
    snare: "Crisp snare drum with bright attack and medium decay",
    hihat: "Short bright hi-hat cymbal sound with metallic character",
    clap: "Sharp hand clap sound with room ambience",
    bass: "Deep bass note with some harmonics and medium sustain",
    synth: "Bright synthesizer chord with medium attack and long release",
    fx: "Atmospheric descending sweep effect with reverb",
    vocal: "Short vocal chop sample with processing"
  };
  
  const promptText = presetPrompts[preset] || "Interesting percussive sound suitable for electronic music";
  
  return generateSoundEffect(apiKey, promptText);
};