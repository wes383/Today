import { GoogleGenAI, Type } from "@google/genai";
import type { ScheduleItemData, ScheduleItem } from '../types';

// Helper to get the API client
const getAiClient = () => {
    const apiKey = localStorage.getItem('geminiApiKey');

    if (!apiKey) {
        throw new Error("Gemini API Key is not set. Please add it in the settings.");
    }
    return new GoogleGenAI({ apiKey });
};

const itemSchema = {
    type: Type.OBJECT,
    properties: {
        title: {
            type: Type.STRING,
            description: "The title for a single, specific activity or task. For example: 'Visit Eiffel Tower', 'Lunch at Le Procope', 'Team Stand-up Meeting'."
        },
        description: {
            type: Type.STRING,
            description: "A brief, one-sentence description of the specific activity. For example: 'Go to the top for a panoramic view of Paris.'"
        },
        date: {
            type: Type.STRING,
            description: "The date of the event in 'YYYY-MM-DD' format."
        },
        time: {
            type: Type.STRING,
            description: 'The specific start time for this single activity, in "HH:mm" (24-hour) format. Omit this field for all-day events.'
        },
        endTime: {
            type: [Type.STRING, Type.NULL],
            description: 'The specific end time for this single activity, in "HH:mm" (24-hour) format. This field is required. It MUST be null if only a start time is mentioned and no duration is specified. Set a time value only if a duration or end time is explicitly provided (e.g., "meeting from 2pm to 3pm", "workout for 1 hour").'
        },
        category: {
            type: Type.STRING,
            description: "Category: 'work', 'personal', 'health', 'fitness', 'shopping', 'social', 'finance', 'travel', or 'study'. Default to 'personal'."
        }
    },
    required: ['title', 'date', 'endTime'],
};

const responseSchema = {
    type: Type.ARRAY,
    items: itemSchema
};

export const parseScheduleWithAI = async (prompt: string, schedule: ScheduleItem[]): Promise<ScheduleItemData[] | null> => {
    try {
        const ai = getAiClient();
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm format
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const tomorrowDate = tomorrow.toISOString().split('T')[0];
        
        const systemInstruction = `You are a proactive and intelligent scheduling assistant. Your primary goal is to help users organize their time by creating detailed and useful schedule items.
You will be given the user's current schedule as a JSON object. Use this schedule as context to avoid conflicts and to intelligently place new items.

Key instructions:
1.  **Deconstruct Complex Requests:** For requests like "plan my 3-day trip to Tokyo," you must generate a separate, individual schedule item for each activity on each day. Do NOT group an entire day's itinerary into a single item's description.
2.  **Example of Correct Deconstruction:**
    *   **User Prompt:** "Plan my first day in Beijing on Oct 26, 2025"
    *   **CORRECT Output (a list of separate items):**
        [
          { "title": "Visit Tiananmen Square", "date": "2025-10-26", "time": "09:00", "endTime": "10:00", "description": "Explore the world's largest public square.", "category": "travel" },
          { "title": "Tour the Forbidden City", "date": "2025-10-26", "time": "10:30", "endTime": "13:00", "description": "Spend a few hours in the imperial palace complex.", "category": "travel" },
          { "title": "Lunch near Forbidden City", "date": "2025-10-26", "time": "13:30", "endTime": "14:30", "category": "personal" },
          { "title": "Climb Jingshan Park", "date": "2025-10-26", "time": "15:00", "endTime": null, "description": "Get a panoramic view of the Forbidden City.", "category": "travel" }
        ]
    *   **INCORRECT Output (grouping into one item):**
        [
          { "title": "Beijing Day 1", "date": "2025-10-26", "time": "09:00", "description": "9:00 AM: Visit Tiananmen Square..." }
        ]
3.  **Parse Simple Requests:** If the user gives a simple task like "dentist appointment tomorrow at 2pm," parse it directly into a single schedule item.
4.  **Time Handling:**
    *   **CRITICAL RULE - Start and End Times:** Your primary goal for time is to identify BOTH a start time (\`time\`) and an end time (\`endTime\`). The \`endTime\` field is REQUIRED.
    *   **When to set 'endTime' to a time value:** You MUST set the \`endTime\` field to a time string ('HH:mm') in these cases:
        *   When a time range is given. **Example:** "Meeting from 2pm to 3:30pm" -> \`time\` is "14:00", \`endTime\` is "15:30".
        *   When a duration is given. **Example:** "Workout for 1 hour starting at 6pm" -> \`time\` is "18:00", \`endTime\` is "19:00".
        *   When a duration is relative to the start. **Example:** "Project meeting in 30 minutes that lasts for 2 hours" (if current time is 14:00) -> \`time\` is "14:30", \`endTime\` is "16:30".
    *   **When to set 'endTime' to null:** You MUST set \`endTime\` to \`null\` if ONLY a start time is mentioned and no duration is specified. **Example:** "Meet friends at 8pm" -> \`time\` is "20:00", \`endTime\` is \`null\`. Do NOT guess an \`endTime\`.
    *   **Relative Time:** You must handle relative times. The current time is ${currentTime}. "in 1 hour" means one hour from now.
    *   **Time Format:** ALL times must be in 'HH:mm' (24-hour) format. This is mandatory. '2 PM' is '14:00'. '9 AM' is '09:00'. This applies to both \`time\` and \`endTime\`.
    *   **General Time of Day:** Infer a specific time for vague terms. 'morning' -> '09:00', 'afternoon' -> '14:00', 'evening' -> '19:00'.
    *   **All-Day Events:** If no time is mentioned (e.g., "Submit report tomorrow"), you MUST omit the \`time\` field and set \`endTime\` to \`null\`.
    *   **Final Check:** Before finishing, review your generated items. Did you correctly add \`endTime\` for every item that had a duration or range, and set it to \`null\` for others?
5.  **Find Free Time:** If the user asks to schedule something "in my free time" or "when I'm free," analyze the provided schedule for the specified day and find an open slot. A good free slot is at least 1-2 hours away from other scheduled items. For example, if there's a meeting at 10:00 and another at 14:30, 12:00 would be a good time for a lunch task.
6.  **Category Assignment:** Assign a relevant category from the list: 'work', 'personal', 'health', 'fitness', 'shopping', 'social', 'finance', 'travel', 'study'. Use your best judgment to select the most appropriate one. Default to 'personal' if unsure.
7.  **Formatting Rules:**
    *   Today's date is ${currentDate}. The current time is ${currentTime}. If the user says 'tomorrow', it means ${tomorrowDate}.
    *   The user's current schedule is: ${JSON.stringify(schedule)}
    *   Dates must be in 'YYYY-MM-DD' format.
    *   Always return a JSON array of schedule items, even for a single item.`;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: prompt,
            config: {
                systemInstruction,
                responseMimeType: "application/json",
                responseSchema,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        const jsonString = response.text.trim();
        let parsedJson = JSON.parse(jsonString);

        // Failsafe in case the model doesn't follow instructions and returns a single object
        if (!Array.isArray(parsedJson)) {
            if(parsedJson && typeof parsedJson === 'object' && 'title' in parsedJson && 'date' in parsedJson) {
                parsedJson = [parsedJson];
            } else {
                console.error("AI response was not an array or a valid single item:", parsedJson);
                return null;
            }
        }
        
        const parsedData = parsedJson as Omit<ScheduleItem, 'id'>[];

        if (parsedData.length === 0) {
            return null;
        }

        const validItems = parsedData
            .filter(item => item.title && item.date) // Ensure core fields exist
            .map(item => ({
                title: item.title,
                description: item.description || null,
                date: item.date,
                time: item.time || null,
                endTime: item.endTime !== undefined ? item.endTime : null,
                category: item.category || 'personal',
            } as ScheduleItemData));

        // Helper function to clean and validate time strings
        const cleanTime = (timeStr: string | null | undefined): string | null => {
            if (!timeStr) return null;
            if (/^\d{2}:\d{2}$/.test(timeStr)) return timeStr;
            // If time is not in HH:mm format, try to correct it from formats like '13:00:00Z'.
            const timeMatch = timeStr.match(/^(\d{2}:\d{2})/);
            if (timeMatch) {
                return timeMatch[1];
            }
            // If a parsable HH:mm pattern isn't found, nullify the time to avoid display errors.
            return null; 
        };

        // Clean time formats for both start and end times
        const cleanedItems = validItems.map(item => ({
            ...item,
            time: cleanTime(item.time),
            endTime: cleanTime(item.endTime),
        }));

        // Post-processing: Infer endTime from duration in title/description if it's missing.
        const finalItems = cleanedItems.map(item => {
            if (item.time && !item.endTime) {
                const textToParse = `${item.title} ${item.description || ''}`.toLowerCase();
                
                // Regex to find patterns like "for 1 hour", "for 30 minutes", "90 min", "2 hrs"
                const durationRegex = /(?:for|lasts?|lasting)\s*(\d+(?:\.\d+)?)\s*(hour|hr|minute|min)s?/i;
                const match = textToParse.match(durationRegex);

                if (match) {
                    const value = parseFloat(match[1]);
                    const unit = match[2].toLowerCase();
                    let durationMinutes = 0;

                    if (unit.startsWith('hour') || unit.startsWith('hr')) {
                        durationMinutes = value * 60;
                    } else if (unit.startsWith('minute') || unit.startsWith('min')) {
                        durationMinutes = value;
                    }

                    if (durationMinutes > 0) {
                        const [startHour, startMinute] = item.time!.split(':').map(Number);
                        
                        // Use the item's date to correctly calculate the end time for any day
                        const startDate = new Date(`${item.date}T${item.time}`);
                        
                        const endDate = new Date(startDate.getTime() + durationMinutes * 60000);
                        
                        const endHour = String(endDate.getHours()).padStart(2, '0');
                        const endMinute = String(endDate.getMinutes()).padStart(2, '0');
                        
                        return { ...item, endTime: `${endHour}:${endMinute}` };
                    }
                }
            }
            return item;
        });


        return finalItems.length > 0 ? finalItems : null;

    } catch (error) {
        console.error("Error calling Gemini API:", error);
        throw new Error("Failed to parse schedule with AI. Please try again or add it manually.");
    }
};

export const askAiAboutSchedule = async (prompt: string, schedule: ScheduleItem[]): Promise<string> => {
    try {
        const ai = getAiClient();
        const now = new Date();
        const currentDate = now.toISOString().split('T')[0];
        const currentTime = now.toTimeString().split(' ')[0].substring(0, 5); // HH:mm format

        const systemInstruction = `You are a helpful schedule assistant. The user will provide you with their schedule as a JSON object and ask a question about it. 
Your task is to answer the user's question based *only* on the provided schedule data. 
Be concise, friendly, and helpful. Analyze the data to provide insights.

Key Instructions:
1.  **Current Context:** Today's date is ${currentDate}. The current time is ${currentTime}. You must use this information to answer any questions about the present, such as "Do I have anything scheduled right now?".
2.  **Plain Text Only:** Your entire response must be in plain text. Do not use any Markdown formatting (e.g., **, *, #, -, etc.).
3.  **Natural Language:** Do not output JSON or code. Respond in natural, conversational language.`;

        const fullPrompt = `Based on the following schedule, please answer my question.

        My Schedule:
        ${JSON.stringify(schedule, null, 2)}

        My Question: "${prompt}"
        `;

        const response = await ai.models.generateContent({
            model: "gemini-2.5-flash",
            contents: fullPrompt,
            config: {
                systemInstruction,
                thinkingConfig: { thinkingBudget: 0 },
            },
        });

        return response.text;

    } catch (error) {
        console.error("Error calling Gemini API for chat:", error);
        throw new Error("Failed to get an answer from AI. Please try again.");
    }
};