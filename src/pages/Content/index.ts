import hljs from 'highlight.js';
import { marked } from 'marked';
import { nonNullable } from '../../utils';
import { IconNames, getIcon, type Color } from './modules/svg-icons';
import { Actions, type Action, type OpenaiResponse } from '../../types';
// import { toHtml } from 'hast-util-to-html';

// console.log('Content script works!');

function convertToMarkdownAndHighlight(t: Element, color: Color) {
  if (t.textContent) {
    const tweet = t.textContent;
    // TODO: refactor this code in order to work with many code snippet chunks and not only one.
    const [start, codeString, end] = tweet?.split('```');
    if (!codeString) return;
    const [language] = codeString.split('\n');

    const copyBtn = document.createElement('a');
    copyBtn.innerHTML = getIcon('copy', color);
    copyBtn.style.transition = 'background 0.5s';
    copyBtn.style.borderRadius = '8px';
    copyBtn.style.display = 'inline-block';
    copyBtn.style.padding = '6px 8px';
    copyBtn.style.position = 'absolute';
    copyBtn.style.cursor = 'pointer';
    copyBtn.style.top = '10px';
    copyBtn.style.right = '15px';
    copyBtn.id = 'btn-copy-clip';

    copyBtn.addEventListener('click', () => {
      copyBtn.innerHTML = getIcon('copy-code-check', color);
      setTimeout(() => {
        copyBtn.innerHTML = getIcon('copy', color);
      }, 1000);

      navigator.clipboard.writeText(codeString.slice(language.length));
      chrome.runtime.sendMessage<Action>({
        action: Actions.copyToClipboard,
      });
    });

    // TODO: Use createElement instead of strings.
    const macControlCircle = `<span style="display: inline-block; margin: 0 4px; height: 15px; width: 15px; border-radius: 15px; background: ${
      isDark ? '#545063' : '#f0eae7'
    };"></span>`;
    const cardControls = `<div style="position: absolute; top: 15px; left: 10px;">${macControlCircle}${macControlCircle}${macControlCircle}</div>`;
    const card = (children: string) =>
      `<div style="position: relative; background: ${
        isDark ? '#2a263d' : '#fcf6f3'
      }; padding: 20px 20px 30px 20px; border-radius: 12px;">${cardControls}<div id="tfd-code-block" style="margin-top: 30px;">${children.trim()}</div></div>`;
    t.innerHTML =
      marked.parse(start) +
      card(
        hljs.highlight(codeString, { language }).value.slice(language.length)
      ) +
      marked.parse(end);

    const cardDOM = document.querySelector('#tfd-code-block');
    nonNullable(cardDOM);
    cardDOM.appendChild(copyBtn);

    const langIconBtn = document.createElement('a');
    langIconBtn.style.position = 'absolute';
    langIconBtn.style.cursor = 'pointer';
    langIconBtn.style.bottom = '10px';
    langIconBtn.style.right = '15px';
    langIconBtn.id = 'btn-open-lang-playground';
    langIconBtn.innerHTML = getIcon(
      language as IconNames,
      isDark ? '#0d0a15' : '#f0e1da'
    );

    langIconBtn.addEventListener('click', () => {
      if (language.match(/tsx?$/)) {
        langIconBtn.href = 'https://www.typescriptlang.org/play';
        langIconBtn.target = '_blank';
      }
    });
    cardDOM.appendChild(langIconBtn);

    if (language.match(/tsx?$/)) {
      let loading = false;
      const helpIconBtn = document.createElement('a');
      helpIconBtn.style.position = 'absolute';
      helpIconBtn.style.cursor = 'pointer';
      helpIconBtn.style.bottom = '10px';
      helpIconBtn.style.right = '45px';
      helpIconBtn.id = 'btn-explain-code-';
      helpIconBtn.innerHTML = getIcon('openai', isDark ? '#d3d3d3' : '#545063');

      helpIconBtn.addEventListener('click', () => {
        const shimmer = document.createElement('div');
        shimmer.style.display = 'flex';
        shimmer.style.flexDirection = 'column';
        shimmer.style.background = isDark ? '#1c1a23' : '#f1eae7';
        shimmer.style.borderRadius = '8px';
        shimmer.style.margin = '32px 0';
        shimmer.style.padding = '8px';
        shimmer.style.color = isDark ? '#8ae3ff' : '#2b464d';
        shimmer.innerHTML =
          `<h3 class="blog-post__headline"><span class="skeleton-box" style="width:55%;"></span></h3><div><span class="skeleton-box" style="width:80%;"></span><span class="skeleton-box" style="width:90%;"></span><span class="skeleton-box" style="width:83%;"></span><span class="skeleton-box" style="width:60%;"></span><span class="skeleton-box" style="width:50%;"></span></div><div class="blog-post__meta"><span class="skeleton-box" style="width:70px;"></span></div>`.trim();
        cardDOM.parentElement?.appendChild(shimmer);
        if (!loading) {
          loading = true;
          chrome.runtime.sendMessage<Action, OpenaiResponse>(
            {
              action: Actions.fetchOpenAi,
              payload: { code: codeString },
            },
            (data) => {
              const setContent = (content: string, icon: IconNames = 'info') =>
                `<div style="display: flex; flex-direction: row;"><div style="margin-right: 16px;">${getIcon(
                  icon,
                  isDark ? '#a8edff' : '#232323'
                )}</div><div>${content}</div></div>`.trim();
              if ('error' in data) {
                shimmer.innerHTML = setContent(data.error, 'warning');
              } else {
                shimmer.style.padding = '20px';
                shimmer.style.lineHeight = '150%';
                shimmer.innerHTML = setContent(data.choices[0].text);
              }
              loading = false;
            }
          );
        }
      });
      cardDOM.appendChild(helpIconBtn);
    }
  }
}

let isInit = true;
const tweetWrapper = document.querySelector('#react-root');
const theme = window.matchMedia('(prefers-color-scheme: dark)');
const isDark = theme.matches;

const observer = new MutationObserver((mutations) => {
  const theme = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = theme.matches;
  const color = isDark ? 'white' : 'black';
  if (isInit) {
    const tweets = document.querySelectorAll('[data-testid="tweetText"]');
    tweets.forEach((tweet) => convertToMarkdownAndHighlight(tweet, color));
    isInit = false;
  }
  for (let mutation of mutations) {
    for (let node of mutation.addedNodes) {
      if (!(node instanceof HTMLElement)) continue;
      for (let tweet of node.querySelectorAll('[data-testid="tweetText"]')) {
        convertToMarkdownAndHighlight(tweet, color);
      }
    }
  }
});

chrome.runtime.sendMessage<Action>({
  action: Actions.changeTheme,
  payload: { isDark },
});

theme.addEventListener('change', (event) => {
  event.preventDefault();
  const theme = window.matchMedia('(prefers-color-scheme: dark)');
  const isDark = theme.matches;

  chrome.runtime.sendMessage<Action>({
    action: Actions.changeTheme,
    payload: { isDark },
  });
});

observer.observe(tweetWrapper!, { childList: true, subtree: true });
