// app/page.tsx
import { Chatbot } from "../components/ui/chatbot";

export default function HomePage() {
  return (
    <main style={{ padding: "2rem" }}>
      <h1>Welcome to My Portfolio</h1>
      <p>Explore my projects, blog posts, and chat with my AI assistant below.</p>
      <br />
      <Chatbot />
    </main>
  );
}