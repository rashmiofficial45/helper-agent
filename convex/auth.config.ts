
export default {
  providers: [
    {
      // This domain must exactly match the "iss" in your Clerk JWT payload.
      domain: process.env.CLERK_ISSUER_ID || "https://included-hedgehog-61.clerk.accounts.dev",
      // This should match the "aud" claim from your Clerk JWT template,
      // which by convention for Convex should be "convex".
      applicationID: "convex",
    },
  ],
};