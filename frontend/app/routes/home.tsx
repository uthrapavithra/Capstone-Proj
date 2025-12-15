import { Link } from "react-router"
import { Button } from "~/components/ui/button"

export default function Home() {
  return (
    
    <div>
      <Button variant="outline" type="button">
                <Link to="/login">Login</Link>
              </Button>
    <div className="mt-30 flex items-center justify-center">
      <h1 className = "text-3xl font-bold">Weed Identifier</h1>
    </div>
     <div className="text-center">
      <p className="mt-4">Ask a question or find a weed</p>
      </div> 
      </div>
    
  )
}