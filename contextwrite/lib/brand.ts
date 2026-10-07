// One place to change your brand. Colors apply everywhere (light and dark mode).
export const BRAND = {
  name: "ContextWrite",
  contactEmail: "ogmoses321@gmail.com",     // shown on the Privacy and Terms pages (leave empty to point people to the feedback button)
  primary: "#4C0585",   // deep purple
  accent: "#DBB5EE",    // soft lavender
  logoUrl: "",          // e.g. "/logo.png" (put the file in /public). Empty uses the built-in mark.
  googleLogin: process.env.NEXT_PUBLIC_GOOGLE_LOGIN === "true", // turn on by setting NEXT_PUBLIC_GOOGLE_LOGIN=true in Vercel
};
