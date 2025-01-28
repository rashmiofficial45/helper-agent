import { v } from "convex/values";
import { getUser } from "./chats";
import { mutation, query } from "./_generated/server";

export const messageList = query({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    // const user = await getUser(ctx);
    // if (!user) {
    //   throw new Error("Not Authenticated");
    // }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("asc")
      .collect();
    return messages;
  },
});
export const sendMessages = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) {
      throw new Error("Not Authenticated");
    }
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, "\n"),
      role: "user",
      createdAt: Date.now(),
    });

    return messageId;
  },
});
export const store = mutation({
  args: {
    chatId: v.id("chats"),
    content: v.string(),
    role: v.union(v.literal("user"), v.literal("bot")),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) {
      throw new Error("Not Authenticated");
    }
    const messageId = await ctx.db.insert("messages", {
      chatId: args.chatId,
      content: args.content.replace(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi, "\n"),
      role: args.role,
      createdAt: Date.now(),
    });

    return messageId;
  },
});
export const getLastMessage = mutation({
  args: {
    chatId: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) {
      throw new Error("Not Authenticated");
    }
    const lastMessage = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.chatId))
      .order("desc")
      .first();

    return lastMessage;
  },
});
