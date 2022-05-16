const promptBtnManager = {
    btn: document.getElementById('prompt-btn')!,
    /**
     * * Enables form button
     * */
    enableBtn() {
        this.btn.classList.remove('Spin');
        this.btn.removeAttribute('disabled');
    },
    /**
     * Disables form button
     */
    disableBtn() {
        this.btn.classList.add('Spin');
        this.btn.setAttribute('disabled', 'true');
    }
}

const responsesManager: ResponsesManager = {
    promptResponsesDiv: document.getElementById('prompt-responses-div')!,
    promptResponsesSection: document.getElementById('prompt-responses-section')!,
    // Used for sorting results by the time they were received
    lastResultDiv: null,

    /**
     * Inserts node into responses before last node if it is not null, otherwise it is appended
     * @param promptResponse Node to insert
     */
    insert(promptResponse: PromptResponse) {
        const resultsTemplate = document.getElementById('prompt-response-template') as HTMLTemplateElement;
        const resultDiv = resultsTemplate.content.firstElementChild!.cloneNode(true) as HTMLDivElement;
        resultDiv.querySelector('.Prompt-Div')!.textContent = promptResponse.prompt;
        resultDiv.querySelector('.Response-Div')!.textContent = promptResponse.response;

        // Response section is set to display "none" at start for cleaner look
        this.promptResponsesSection.style.display = 'block';
        // Inserting before last inserted result, to sort by time
        if (this.lastResultDiv !== null) {
            this.promptResponsesDiv.insertBefore(resultDiv, this.lastResultDiv);
        } else {
            this.promptResponsesDiv.appendChild(resultDiv);
        }
        this.lastResultDiv = resultDiv;
    },
    /**
     * Removes all nodes in responses
     */
    clear() {
        while (this.promptResponsesDiv.hasChildNodes()) {
            this.promptResponsesDiv.removeChild(this.promptResponsesDiv.lastChild!);
        }
        this.lastResultDiv = null;
    }
}

// Features two color schemes
// Setting html class to light uses different css variables for themeing
// Theme is saved using localStorage
const themeManager : ThemeManager = {
    currentTheme: null,
    htmlNode: document.querySelector('html')!,
    setTheme(theme: 'light' | 'dark') {
        if(this.currentTheme !== null) {
            this.htmlNode.classList.remove(this.currentTheme);
        }
        this.htmlNode.classList.add(theme);
        this.currentTheme = theme;
        localStorage.setItem('theme', theme);
    },
    toggleTheme() {
        if(this.currentTheme === 'light') {
            this.setTheme('dark');
        } else {
            this.setTheme('light');
        }
    }
}

/**
 * Used for testing only
 * @param seconds Amount of seconds to delay
 * @returns 
 */
 async function delay(seconds: number): Promise<void> {
    return new Promise((response) => {
        setTimeout(() => {
            response();
        }, seconds * 1000);
    });
}

// Getting API key this way because Open AI seems to rotate key when uploaded to GitHub
let apiKey: string | null = null;
(async function () {
    apiKey = await (await fetch("/api-key.txt")).text();
    if (!apiKey) {
        throw 'Unable to fetch API key';
    }
    promptBtnManager.enableBtn();
})();

// Results are saved using localStorage API
const storedPromptResponsesJson = localStorage.getItem('storedPromptResponses');
const storedPromptResponses: PromptResponse[] = storedPromptResponsesJson ? JSON.parse(storedPromptResponsesJson) as PromptResponse[] : [];
// Rendering results at load time
for (const promptResponse of storedPromptResponses) {
    responsesManager.insert(promptResponse);
}

document.getElementById('prompt-form')!.addEventListener('submit', async function (e) {
    e.preventDefault();
    const prompt = (document.getElementById('prompt-input') as HTMLInputElement).value;
    promptBtnManager.disableBtn();
    const gptResponse = await (await fetch("https://api.openai.com/v1/engines/text-curie-001/completions", {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
            prompt: prompt,
            temperature: 0.8,
            max_tokens: 64
        }),
    })).json();
    /*
    // Previously used for testing only
    const gptResponses = [];
    const gptResponse = JSON.parse(gptResponses[Math.floor(Math.random() * gptResponses.length)]);
    await delay(3);
    */
    promptBtnManager.enableBtn();
    if (gptResponse.choices === undefined || gptResponse.choices.length === 0) {
        throw 'Choices missing in response';
    }
    // Adding "..." if "finish_reason" is "length" to indicate that is not the end of output
    // Also trimming because API seems to send two newlines (\n\n) at beginning of text
    const response = (gptResponse.choices[0].finish_reason === 'length' ? gptResponse.choices[0].text + '...' : gptResponse.choices[0].text).trim();
    const promptResponse = { prompt, response };
    responsesManager.insert(promptResponse);
    // Saving using localStorage API
    storedPromptResponses.push(promptResponse);
    localStorage.setItem('storedPromptResponses', JSON.stringify(storedPromptResponses));
});

themeManager.setTheme(localStorage.getItem('theme') as 'light' | 'dark' | null ?? 'dark');
document.getElementById('theme-button')!.addEventListener('click', function () {
    themeManager.toggleTheme();
});

document.getElementById('clear-prompt-responses-button')!.addEventListener('click', function () {
    storedPromptResponses.splice(0);
    localStorage.setItem('storedPromptResponses', JSON.stringify(storedPromptResponses));
    responsesManager.clear();
});

interface PromptResponse {
    prompt: string;
    response: string;
}

interface ResponsesManager {
    promptResponsesDiv: HTMLElement;
    promptResponsesSection: HTMLElement;
    lastResultDiv: null | HTMLElement;
    insert(promptResponse: PromptResponse): void;
    clear(): void;
}

interface ThemeManager {
    currentTheme: "light" | "dark" | null;
    htmlNode: HTMLHtmlElement;
    setTheme(theme: 'light' | 'dark'): void;
    toggleTheme(): void;
}