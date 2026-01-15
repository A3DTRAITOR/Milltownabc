import { Switch, Route, useLocation } from "wouter";
import { useEffect, useRef } from "react";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

function ScrollToTop() {
  const [location] = useLocation();
  const prevLocation = useRef(location);

  useEffect(() => {
    if (location !== prevLocation.current) {
      window.scrollTo(0, 0);
      prevLocation.current = location;
    }
  }, [location]);

  return null;
}

import Home from "@/pages/Home";
import About from "@/pages/About";
import Services from "@/pages/Services";
import Blog from "@/pages/Blog";
import BlogPost from "@/pages/BlogPost";
import Contact from "@/pages/Contact";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import Sessions from "@/pages/Sessions";
import Dashboard from "@/pages/Dashboard";
import AdminDashboard from "@/pages/admin/Dashboard";
import AdminPages from "@/pages/admin/Pages";
import AdminBlogList from "@/pages/admin/BlogList";
import AdminBlogEditor from "@/pages/admin/BlogEditor";
import AdminMedia from "@/pages/admin/Media";
import AdminSettings from "@/pages/admin/Settings";
import NotFound from "@/pages/not-found";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/services" component={Services} />
      <Route path="/sessions" component={Sessions} />
      <Route path="/blog" component={Blog} />
      <Route path="/blog/:slug" component={BlogPost} />
      <Route path="/contact" component={Contact} />
      <Route path="/login" component={Login} />
      <Route path="/register" component={Register} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/admin" component={AdminDashboard} />
      <Route path="/admin/pages" component={AdminPages} />
      <Route path="/admin/blog" component={AdminBlogList} />
      <Route path="/admin/blog/:id" component={AdminBlogEditor} />
      <Route path="/admin/media" component={AdminMedia} />
      <Route path="/admin/settings" component={AdminSettings} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <ScrollToTop />
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
