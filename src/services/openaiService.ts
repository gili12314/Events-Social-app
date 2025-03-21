import OpenAI from "openai";
import dotenv from "dotenv";

dotenv.config();

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
});

export const getEventImprovementSuggestions = async (title: string, description: string, participants: number): Promise<string> => {
  try {
    const prompt = `אני עוזר למארגני אירועים לשפר את האירועים שלהם. הנה הפרטים של אירוע:
    - שם האירוע: ${title}
    - תיאור האירוע: ${description}
    - מספר משתתפים משוער: ${participants}

    תן לי הצעות לשיפור האירוע, כולל רעיונות להפעלות, שיפור חוויית המשתתפים ושדרוגים שיכולים להפוך אותו למיוחד יותר.`;

    const response = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "system", content: prompt }],
    });

    return response.choices[0]?.message?.content || "לא נמצאו הצעות.";
  } catch (error) {
    console.error("Error getting suggestions from OpenAI:", error);
    return "שגיאה בקבלת הצעות.";
  }
};
