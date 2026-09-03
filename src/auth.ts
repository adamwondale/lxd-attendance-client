import NextAuth from "next-auth";
import Google from "next-auth/providers/google";
import Credentials from "next-auth/providers/credentials";

export const { handlers, signIn, signOut, auth } = NextAuth({
  secret:
    process.env.AUTH_SECRET ||
    process.env.NEXTAUTH_SECRET ||
    (process.env.NODE_ENV !== "production" ? "lxd-attendance-local-dev-secret" : undefined),
  trustHost: true,
  providers: [
    // --- Student flow: Google OAuth ---
    Google({
      // Auth.js v5 auto-reads AUTH_GOOGLE_ID + AUTH_GOOGLE_SECRET from .env.local
    }),

    // --- Admin flow: Email + Password via our NestJS backend ---
    Credentials({
      id: "admin-credentials",
      name: "Admin",
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        try {
          const res = await fetch(
            process.env.NEXT_PUBLIC_GRAPHQL_URL ||
              "http://localhost:9000/graphql",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
                  mutation LoginAdmin($email: String!, $password: String!) {
                    loginAdmin(email: $email, password: $password) {
                      accessToken
                    }
                  }
                `,
                variables: {
                  email: credentials.email,
                  password: credentials.password,
                },
              }),
            },
          );

          const json = await res.json();
          if (json.errors || !json.data?.loginAdmin?.accessToken) return null;

          return {
            id: credentials.email as string,
            email: credentials.email as string,
            name: "Admin",
            role: "ADMIN",
            accessToken: json.data.loginAdmin.accessToken,
          };
        } catch {
          return null;
        }
      },
    }),

    // --- Student flow: Identifier + Password ---
    Credentials({
      id: "student-credentials",
      name: "Student",
      credentials: {
        identifier: { label: "Email or Username", type: "text" },
        password: { label: "Password", type: "password" },
      },
      async authorize(credentials) {
        if (!credentials?.identifier || !credentials?.password) return null;

        try {
          const res = await fetch(
            process.env.NEXT_PUBLIC_GRAPHQL_URL ||
              "http://localhost:9000/graphql",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
                  mutation LoginStudent($identifier: String!, $password: String!) {
                    loginStudent(identifier: $identifier, password: $password) {
                      accessToken
                    }
                  }
                `,
                variables: {
                  identifier: credentials.identifier,
                  password: credentials.password,
                },
              }),
            },
          );

          const json = await res.json();
          if (json.errors || !json.data?.loginStudent?.accessToken) return null;

          return {
            id: credentials.identifier as string,
            email: credentials.identifier as string, // Fallback for NextAuth
            name: "Student",
            role: "STUDENT",
            accessToken: json.data.loginStudent.accessToken,
          };
        } catch {
          return null;
        }
      },
    }),
  ],

  session: { strategy: "jwt" },

  callbacks: {
    async jwt({ token, user, account }) {
      // 1. Admin login passes accessToken on `user` during `authorize`
      if (user && "accessToken" in user) {
        token.role = (user as any).role;
        token.accessToken = (user as any).accessToken;
      }

      // 2. Google OAuth login: We must exchange Google's id_token for our backend's JWT
      if (account?.provider === "google" && account.id_token) {
        try {
          const res = await fetch(
            process.env.NEXT_PUBLIC_GRAPHQL_URL ||
              "http://localhost:9000/graphql",
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                query: `
                  mutation LoginGoogle($token: String!) {
                    loginWithGoogle(idToken: $token) {
                      accessToken
                    }
                  }
                `,
                variables: {
                  token: account.id_token,
                },
              }),
            },
          );
          const json = await res.json();

          if (json.data?.loginWithGoogle?.accessToken) {
            token.accessToken = json.data.loginWithGoogle.accessToken;
            token.role = "STUDENT"; // Google users are always students
          } else {
            console.error("[Auth.js] Missing accessToken in backend response");
          }
        } catch (e) {
          console.error("[Auth.js] Failed to exchange Google token:", e);
        }
      }
      return token;
    },
    async session({ session, token }) {
      // Expose on the client session object
      (session.user as any).role = (token.role as string) || "STUDENT";
      (session.user as any).accessToken = token.accessToken as string | null;
      return session;
    },
  },

  pages: {
    signIn: "/student/login", // Use our custom login page
    error: "/student/login", // Redirect errors back to login with ?error=
  },
});
