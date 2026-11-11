import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import AppRoutes from "./routes/AppRoutes";
import { ThemeProvider } from "./theme/ThemeProvider";

import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(

    <ThemeProvider>

        <BrowserRouter>

            <AppRoutes />

        </BrowserRouter>

    </ThemeProvider>

);
