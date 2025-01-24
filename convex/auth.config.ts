export default {
    providers: [
      {
        domain: process.env.CLERK_ISSUER_ID,
        applicationID: "convex",
      },
    ]
  };