import { v } from "convex/values";
import { mutation, MutationCtx, query, QueryCtx } from "./_generated/server";

export async function getUser(ctx: QueryCtx | MutationCtx) {
  const identity = await ctx.auth.getUserIdentity();
  if (!identity) {
    throw new Error("Unauthenticated call to function");
  }
  return identity;
}

export const createChat = mutation({
  args: {
    title: v.string(),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) {
      throw new Error("Not Authenticated");
    }
    const chat = await ctx.db.insert("chats", {
      title: args.title,
      userId: user.subject,
      createdAt: Date.now(),
    });
    return chat;
  },
});
export const deleteChat = mutation({
  args: {
    id: v.id("chats"),
  },
  handler: async (ctx, args) => {
    const user = await getUser(ctx);
    if (!user) {
      throw new Error("Not Authenticated");
    }
    const chat = await ctx.db.get(args.id);
    if (!chat) {
      throw new Error("Chat not found");
    }
    if (chat.userId !== user.subject) {
      throw new Error("Not Authorized");
    }
    const messages = await ctx.db
      .query("messages")
      .withIndex("by_chat", (q) => q.eq("chatId", args.id))
      .collect();
    for (const message of messages) {
      await ctx.db.delete(message._id);
    }
    await ctx.db.delete(args.id);
  },
});

export const chatList = query({
  handler: async (ctx) => {
    const user = await getUser(ctx);
    if (!user) {
      throw new Error("Not Authenticated");
    }
    const chats = await ctx.db
      .query("chats")
      .withIndex("by_user", (q) => q.eq("userId",user.subject))
      .order("desc")
      .collect();
    return chats;
  },
});
