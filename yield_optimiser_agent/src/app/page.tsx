"use client"
import "./styles.scss";
import dynamic from "next/dynamic";


const DynamicAgent = dynamic(
  () =>
    import("@/Components/Frontend/Agent").then((mod) => mod.ChatAgent),
  {
    ssr: false,
  }
);

export default function Home() {
  return (
    <main className="MainAgentWrapper">
     <DynamicAgent/>
    </main>
  );
}
