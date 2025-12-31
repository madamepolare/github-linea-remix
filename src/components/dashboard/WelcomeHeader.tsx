import { motion } from "framer-motion";
import { Calendar, Sun, Cloud, CloudRain } from "lucide-react";

export function WelcomeHeader() {
  const now = new Date();
  const hour = now.getHours();
  
  const getGreeting = () => {
    if (hour < 12) return "Good morning";
    if (hour < 18) return "Good afternoon";
    return "Good evening";
  };

  const formatDate = () => {
    return now.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  // Simulate weather (you could integrate a real API)
  const weather = { temp: 18, condition: "sunny" };
  const WeatherIcon = weather.condition === "sunny" ? Sun : weather.condition === "cloudy" ? Cloud : CloudRain;

  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between"
    >
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight text-foreground">
          {getGreeting()}, Jean
        </h1>
        <p className="text-muted-foreground mt-1">
          Here's what's happening with your projects today.
        </p>
      </div>
      <div className="flex items-center gap-4 mt-4 sm:mt-0">
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
          <Calendar className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">{formatDate()}</span>
        </div>
        <div className="flex items-center gap-2 rounded-lg bg-muted/50 px-4 py-2">
          <WeatherIcon className="h-4 w-4 text-accent" />
          <span className="text-sm text-muted-foreground">{weather.temp}°C</span>
        </div>
      </div>
    </motion.div>
  );
}
