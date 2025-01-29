import { Id } from "../../convex/_generated/dataModel";

export type MessageRole = "user" | "bot";

export interface Messages {
    content: string;
    role: MessageRole
}
export interface ChatRequestBody {
    messages: Messages[];
    newMessage:string;
    chatId: Id<"chats">;
    }
