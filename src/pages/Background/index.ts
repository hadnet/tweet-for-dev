import { nonNullable } from '../../utils';
import { Actions, type Action, type OpenaiResponse } from '../../types';

let isDark: boolean;

function setCSSTheme(isDark: boolean, tabId: number | undefined) {
  nonNullable(tabId);
  if (isDark) {
    chrome.scripting.insertCSS(
      {
        files: ['a11y-dark.css'],
        target: {
          tabId,
        },
      },
      () => {
        console.log('Dark CSS inserted');
      }
    );
    chrome.scripting.removeCSS({
      files: ['a11y-light.css'],
      target: {
        tabId,
      },
    });
  } else {
    chrome.scripting.insertCSS(
      {
        files: ['a11y-light.css'],
        target: {
          tabId,
        },
      },
      () => {
        console.log('Light CSS inserted');
      }
    );
    chrome.scripting.removeCSS({
      files: ['a11y-dark.css'],
      target: {
        tabId,
      },
    });
  }
}

chrome.runtime.onMessage.addListener(
  (message: Action, sender, sendResponse) => {
    switch (message.action) {
      case Actions.fetchOpenAi:
        //INFO: cant use async/await here because onMessage doesnt work properly with `await`
        fetch('https://openai-api.hadnet.workers.dev/?action=explain-code', {
          method: 'POST',
          body: JSON.stringify({ code: message.payload?.code }),
          headers: {
            'Content-Type': 'application/json; charset=utf-8',
          },
        })
          .then((response) => response.json())
          .then((data: OpenaiResponse) => {
            sendResponse(data);
          })
          .catch((e) => console.log('Error', e));
        break;
      case Actions.copyToClipboard:
        chrome.notifications.create(
          {
            type: 'basic',
            title: 'Copied!',
            message: 'The code snippet was copied to your clipboard',
            iconUrl: 'icon-128.png',
          },
          () => console.log('notification created')
        );
        break;
      default:
        if (sender.url?.includes('https://twitter.com')) {
          isDark = message.payload?.isDark;
          setCSSTheme(isDark, sender.tab?.id);
        }
    }
    return true;
  }
);
