import { createFileRoute, ClientOnly } from "@tanstack/react-router";
import { lazy, Suspense } from "react";

const GameShell = lazy(() => import("@/components/game/GameShell"));

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Portfolio Quest — Lucas Amaral, Dev Full Stack Jr." },
      {
        name: "description",
        content:
          "Portfólio jogável em pixel art estilo Pokémon: explore a cidade, entre nas construções e conheça a trajetória, skills e projetos de Lucas Amaral.",
      },
      { property: "og:title", content: "Portfolio Quest — Lucas Amaral" },
      {
        property: "og:description",
        content:
          "Um portfólio de desenvolvedor em formato de jogo 2D: cidade explorável, interiores e diálogos com meus projetos.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Home,
});

function Loading() {
  return (
    <div className="flex min-h-screen items-center justify-center">
      <p className="pixel-font animate-pulse text-[10px]">Iniciando cartucho...</p>
    </div>
  );
}

function Home() {
  return (
    <ClientOnly fallback={<Loading />}>
      <Suspense fallback={<Loading />}>
        <GameShell />
      </Suspense>
    </ClientOnly>
  );
}
