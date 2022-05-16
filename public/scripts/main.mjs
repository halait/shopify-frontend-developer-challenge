"use strict";
const htmlNode = document.querySelector('html');
const promptForm = document.getElementById('prompt-form');
const promptInput = document.getElementById('prompt-input');
const promptResponsesDiv = document.getElementById('prompt-responses-div');
const promptResponsesSection = document.getElementById('prompt-responses-section');
const promptBtn = document.getElementById('prompt-btn');
promptBtn.classList.remove('Spin');
let lastResultDiv = null;
const storedPromptResponsesJson = localStorage.getItem('storedPromptResponses');
const storedPromptResponses = storedPromptResponsesJson ? JSON.parse(storedPromptResponsesJson) : [];
for (const promptResponse of storedPromptResponses) {
    appendPromptResponse(promptResponse);
}
promptForm.addEventListener('submit', async function (e) {
    e.preventDefault();
    const prompt = promptInput.value;
    const data = {
        prompt: prompt,
        temperature: 0.8,
        max_tokens: 64
    };
    promptBtn.classList.add('Spin');
    promptBtn.setAttribute('disabled', 'true');
    const gptResponse = await (await fetch("https://api.openai.com/v1/engines/text-curie-001/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer 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`,
        },
        body: JSON.stringify(data),
    })).json();
    /*
    // Previously used for testing only
    const gptResponses = [];
    const gptResponse = JSON.parse(gptResponses[Math.floor(Math.random() * gptResponses.length)]);
    await delay(3);
    */
    console.log(gptResponse);
    promptBtn.classList.remove('Spin');
    promptBtn.removeAttribute('disabled');
    if (gptResponse.choices === undefined || gptResponse.choices.length === 0) {
        throw 'Choices missing in response';
    }
    const response = (gptResponse.choices[0].finish_reason === 'length' ? gptResponse.choices[0].text + '...' : gptResponse.choices[0].text).trim();
    const promptResponse = { prompt, response };
    appendPromptResponse(promptResponse);
    storedPromptResponses.push(promptResponse);
    localStorage.setItem('storedPromptResponses', JSON.stringify(storedPromptResponses));
});
async function delay(seconds) {
    return new Promise((response) => {
        setTimeout(() => {
            response();
        }, seconds * 1000);
    });
}
function appendPromptResponse(promptResponse) {
    const resultsTemplate = document.getElementById('prompt-response-template');
    const resultDiv = resultsTemplate.content.firstElementChild.cloneNode(true);
    resultDiv.querySelector('.Prompt-Div').textContent = promptResponse.prompt;
    resultDiv.querySelector('.Response-Div').textContent = promptResponse.response;
    promptResponsesSection.style.display = 'block';
    if (lastResultDiv !== null) {
        promptResponsesDiv.insertBefore(resultDiv, lastResultDiv);
    }
    else {
        promptResponsesDiv.appendChild(resultDiv);
    }
    lastResultDiv = resultDiv;
}
let currentTheme = localStorage.getItem('theme') ?? 'dark';
if (currentTheme !== 'dark') {
    htmlNode.classList.add('light');
}
document.getElementById('theme-button').addEventListener('click', function () {
    if (currentTheme === 'dark') {
        htmlNode.classList.add('light');
        currentTheme = 'light';
    }
    else {
        htmlNode.classList.remove('light');
        currentTheme = 'dark';
    }
    localStorage.setItem('theme', currentTheme);
});
document.getElementById('clear-prompt-responses-button').addEventListener('click', function () {
    lastResultDiv = null;
    storedPromptResponses.splice(0);
    localStorage.setItem('storedPromptResponses', JSON.stringify(storedPromptResponses));
    while (promptResponsesDiv.hasChildNodes()) {
        promptResponsesDiv.removeChild(promptResponsesDiv.lastChild);
    }
});
