export type OpenaiResponse =
  | {
      id: string;
      object: string;
      created: number;
      model: string;
      choices: {
        text: string;
        index: number;
        logprobs?: any;
        finish_reason: string;
      }[];
      usage: {
        prompt_tokens: number;
        completion_tokens: number;
        total_tokens: number;
      };
    }
  | {
      error: string;
    };

export const enum Actions {
  copyToClipboard = 'copyToClipboard',
  fetchOpenAi = 'fetchOpenAi',
  changeTheme = 'changeTheme',
}

export type Action = {
  action: Actions;
  payload?: any;
};
