import { streamText } from 'ai';
import { google } from '@ai-sdk/google';
import 'dotenv/config';

async function run() {
    console.log("--- DEBUG START KEY INSPECTION ---");
    try {
        console.log("Calling streamText...");
        const result = streamText({
            model: google('gemini-1.5-flash'),
            prompt: 'test'
        });

        console.log("Is Promise?", result instanceof Promise);

        if (result instanceof Promise) {
            console.log("Result is a Promise (unexpected based on previous run).");
        } else {
            console.log("Result Type:", (result as any).constructor?.name);
            console.log("Result Keys:", Object.keys(result));

            // Check prototype methods
            const proto = Object.getPrototypeOf(result);
            console.log("Prototype Methods:", Object.getOwnPropertyNames(proto));
        }

    } catch (error) {
        console.error("Test failed:", error);
    }
    console.log("--- DEBUG END ---");
}

run();
