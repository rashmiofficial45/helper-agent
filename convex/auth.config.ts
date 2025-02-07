const config = {
    providers: [
      {
        domain: process.env.CLERK_ISSUER_ID,
        applicationID: "convex",
      },
    ]
  };

export default config;