import { Leaf } from "lucide-react";
import { Link } from "react-router";
import { Button } from "~/components/ui/button";

export default function Home() {
  return (
    <div
      className="min-h-screen bg-cover bg-center"
      style={{
        backgroundImage:
        "url('https://images.unsplash.com/photo-1501004318641-b39e6451bec6')",
          
      }}
    >
      {/* Top Pane */}
      <header className="flex items-center px-6 py-4 bg-white/80 shadow-md backdrop-blur">
      <Button asChild variant="outline" className="rounded-full p-2 mr-4">
        <Link to="/home" aria-label="Home">
          <Leaf className="h-5 w-5 " />
        </Link>
      </Button>
        <div className="flex justify-end gap-3">
          <Button variant="outline" type="button">
            <Link to="/login">Log In</Link>
          </Button>
          <Button variant="outline" type="button">
            <Link to="/signup">Sign Up</Link>
          </Button>
        </div>
      </header>

      {/* Center Content */}
      <main className="flex items-center justify-center min-h-[calc(100vh-20px)]">
        <div className="bg-white/80 backdrop-blur-md shadow-xl rounded-xl px-20 py-12 text-center max-w-md w-full">
          <h1 className="text-3xl font-bold mb-6">Weed Identifier and Control</h1>
          <p className="text-gray-700">
            Ask a question to find the weed and to control it
          </p>
        </div>
      </main>
    </div>
  );
}
