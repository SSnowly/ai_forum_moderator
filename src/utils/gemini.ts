import { GoogleGenerativeAI } from '@google/generative-ai';
import { logError, logDebug } from './logger';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

interface ValidationResult {
    valid: boolean;
    reason: string;
}

function cleanResponse(response: string): string {
    try {
        
        let cleaned = response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();

        
        if (cleaned.startsWith('{') && cleaned.endsWith('}')) {
            
            cleaned = cleaned.replace(/\\"/g, '"');
            const parsed = JSON.parse(cleaned);
            return parsed.reason || cleaned;
        }

        return cleaned;
    } catch (error) {
        
        return response
            .replace(/```json\n?/g, '')
            .replace(/```\n?/g, '')
            .trim();
    }
}

async function getDetailedReason(content: string): Promise<string> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const detailPrompt = `You are a helpful forum moderator. The following post needs improvement. 
Provide a clear, list of what needs to be fixed. Be specific and constructive.

Rules to check:
- Must be in proper English
- Must include detailed project description
- Must list required skills and experience
- Must include project scope and budget
- No scams or unrealistic promises
- No generic listings
- Only say "This post is a scam. Please do not post it." if you are 100% sure. random spam does not count.
- dont say "Okay, I've reviewed the post. Here's what needs to be fixed" or similar.
Format your response as discord message.
DO NOT use JSON format or code blocks.

Post to review:
${content}`;
        
        logDebug('Generating detailed reason...');
        const result = await model.generateContent(detailPrompt);
        let response = result.response.text().trim();
        logDebug(`Raw detailed response: ${response}`);
        if (response.includes("This post is a scam. Please do not post it.")) {
            return "This post is a scam. Please do not post it.";
        }
        
        response = "Your post needs the following improvements:\n\n• " + response;

        const finalResponse = response.length > 1000 ? response.slice(0, 997) + '...' : response;
        logDebug(`Final detailed response: ${finalResponse}`);
        return finalResponse;
    } catch (error) {
        logError(`Error generating detailed reason: ${error}`);
        return 'Could not generate detailed feedback. Please review the forum rules and ensure all requirements are met.';
    }
}

export async function validateForumPost(content: string): Promise<ValidationResult> {
    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
        const prompt = process.env.GEMINI_FORUM_PROMPT!;
        
        
        if (!content.trim()) {
            return {
                valid: false,
                reason: 'Post content cannot be empty.'
            };
        }

        const result = await model.generateContent(`${prompt}\n\nPost Content to validate:\n${content}`);
        const response = result.response.text();
        logDebug(`Initial validation response: ${response}`);
        
        try {
            
            let cleaned = response
                .replace(/```json\n?/g, '')
                .replace(/```\n?/g, '')
                .trim();

            logDebug(`Cleaned markdown: ${cleaned}`);
            
            
            const parsedResponse = JSON.parse(cleaned) as ValidationResult;
            logDebug(`Parsed response: ${JSON.stringify(parsedResponse)}`);
            
            
            if (typeof parsedResponse.valid !== 'boolean' || typeof parsedResponse.reason !== 'string') {
                throw new Error('Invalid response structure');
            }

            
            if (!parsedResponse.valid) {
                logDebug('Post not valid, getting detailed reason...');
                const detailedReason = await getDetailedReason(content);
                logDebug(`Got detailed reason: ${detailedReason}`);
                return {
                    valid: false,
                    reason: detailedReason
                };
            }

            return parsedResponse;
        } catch (parseError) {
            logError(`Error parsing Gemini response: ${response}`);
            return {
                valid: false,
                reason: 'Error processing validation response. Please try again or contact a moderator.'
            };
        }
    } catch (error) {
        logError(`Gemini API Error: ${error}`);
        
        
        const errorMessage = error instanceof Error ? error.message : String(error);
        if (errorMessage.includes('API key')) {
            return {
                valid: false,
                reason: 'API configuration error. Please contact an administrator.'
            };
        } else if (errorMessage.includes('rate')) {
            return {
                valid: false,
                reason: 'Service is temporarily busy. Please try again in a few minutes.'
            };
        }

        return {
            valid: false,
            reason: 'Error validating post content. Please try again or contact a moderator.'
        };
    }
} 