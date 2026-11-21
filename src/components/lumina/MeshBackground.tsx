export function MeshBackground() {
  return (
    <div aria-hidden className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-background">
      <div className="mesh-blob mesh-a -left-[15vw] -top-[10vh] h-[70vh] w-[70vw]" />
      <div className="mesh-blob mesh-b right-[-20vw] top-[20vh] h-[80vh] w-[60vw]" />
      <div className="mesh-blob mesh-c bottom-[-25vh] left-[20vw] h-[70vh] w-[60vw]" />
      <div className="mesh-blob mesh-a bottom-[5vh] right-[5vw] h-[45vh] w-[40vw] opacity-80" />
      <div className="grain absolute inset-0" />
    </div>
  );
}
