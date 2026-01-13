import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { MessageSquare, CheckCircle2, Clock, User, Bell, AtSign } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const tasks = [
  { id: 1, title: "Finaliser plans niveau R+1", assignee: "ML", status: "done", comments: 3 },
  { id: 2, title: "Valider choix menuiseries", assignee: "SD", status: "in-progress", comments: 5 },
  { id: 3, title: "Mettre à jour planning", assignee: "JP", status: "pending", comments: 1 },
];

const initialComments = [
  { id: 1, author: "Sophie D.", avatar: "SD", text: "J'ai validé avec le client, on part sur l'option aluminium.", time: "Il y a 2h" },
  { id: 2, author: "Marc L.", avatar: "ML", text: "@Sophie D. Parfait, je mets à jour le devis.", time: "Il y a 1h" },
];

const newComment = { id: 3, author: "Jean P.", avatar: "JP", text: "Le fournisseur peut livrer semaine prochaine 👍", time: "À l'instant" };

export const CollaborationDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);
  const [comments, setComments] = useState(initialComments);
  const [showNotification, setShowNotification] = useState(false);

  useEffect(() => {
    if (!demoRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".tasks-panel", {
        opacity: 0,
        x: -30,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 80%",
          once: true,
        },
      });

      gsap.from(".comments-panel", {
        opacity: 0,
        x: 30,
        duration: 0.6,
        delay: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 80%",
          once: true,
        },
      });

      gsap.from(".task-item", {
        opacity: 0,
        y: 15,
        stagger: 0.1,
        duration: 0.4,
        delay: 0.3,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 80%",
          once: true,
        },
      });
    }, demoRef);

    return () => ctx.revert();
  }, []);

  // Simulate new comment arriving
  useEffect(() => {
    const timer = setTimeout(() => {
      setShowNotification(true);
      setTimeout(() => {
        setComments((prev) => [...prev, newComment]);
        setShowNotification(false);
      }, 1500);
    }, 3000);

    // Reset periodically
    const resetTimer = setInterval(() => {
      setComments(initialComments);
      setTimeout(() => {
        setShowNotification(true);
        setTimeout(() => {
          setComments((prev) => [...prev, newComment]);
          setShowNotification(false);
        }, 1500);
      }, 3000);
    }, 10000);

    return () => {
      clearTimeout(timer);
      clearInterval(resetTimer);
    };
  }, []);

  return (
    <div ref={demoRef} className="relative bg-card rounded-2xl border border-border/50 p-6 overflow-hidden">
      <div className="grid md:grid-cols-2 gap-6">
        {/* Tasks Panel */}
        <div className="tasks-panel">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-primary" />
              Tâches de l'équipe
            </h4>
            <span className="text-xs text-muted-foreground">3 tâches</span>
          </div>

          <div className="space-y-3">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="task-item p-3 rounded-lg border border-border/50 hover:border-primary/30 transition-all bg-card"
              >
                <div className="flex items-start gap-3">
                  {task.status === "done" ? (
                    <CheckCircle2 className="w-5 h-5 text-emerald-500 flex-shrink-0 mt-0.5" />
                  ) : task.status === "in-progress" ? (
                    <Clock className="w-5 h-5 text-amber-500 flex-shrink-0 mt-0.5" />
                  ) : (
                    <div className="w-5 h-5 rounded-full border-2 border-muted-foreground/30 flex-shrink-0 mt-0.5" />
                  )}
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm ${task.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}`}>
                      {task.title}
                    </p>
                    <div className="flex items-center gap-3 mt-1.5">
                      <div className="flex items-center gap-1">
                        <div className="w-5 h-5 rounded-full bg-primary/10 flex items-center justify-center text-[10px] font-medium text-primary">
                          {task.assignee}
                        </div>
                      </div>
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <MessageSquare className="w-3 h-3" />
                        {task.comments}
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Comments Panel */}
        <div className="comments-panel">
          <div className="flex items-center justify-between mb-4">
            <h4 className="font-semibold text-foreground text-sm flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Discussion
            </h4>
            <span className="text-xs text-primary">Menuiseries</span>
          </div>

          <div className="space-y-3 max-h-[220px] overflow-y-auto">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className={`flex gap-3 transition-all duration-500 ${comment.id === 3 ? "animate-fade-in" : ""}`}
              >
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-medium text-white flex-shrink-0">
                  {comment.avatar}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{comment.author}</span>
                    <span className="text-xs text-muted-foreground">{comment.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {comment.text.includes("@") ? (
                      <>
                        {comment.text.split("@")[0]}
                        <span className="text-primary font-medium">@{comment.text.split("@")[1].split(" ")[0]}</span>
                        {" " + comment.text.split("@")[1].split(" ").slice(1).join(" ")}
                      </>
                    ) : (
                      comment.text
                    )}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Typing indicator */}
          <div className="mt-4 p-3 bg-muted/30 rounded-lg border border-border/30">
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <AtSign className="w-3 h-3" />
              <span>Mentionnez un collègue avec @...</span>
            </div>
          </div>
        </div>
      </div>

      {/* Notification toast */}
      {showNotification && (
        <div className="absolute top-4 right-4 bg-primary text-white rounded-lg px-4 py-2 text-sm font-medium flex items-center gap-2 animate-slide-in-right shadow-lg">
          <Bell className="w-4 h-4" />
          Nouveau commentaire
        </div>
      )}

      {/* Team avatars */}
      <div className="absolute bottom-4 right-4 flex -space-x-2">
        {["ML", "SD", "JP", "CL"].map((initials, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-violet-500 flex items-center justify-center text-[10px] font-medium text-white border-2 border-card"
            style={{ zIndex: 10 - i }}
          >
            {initials}
          </div>
        ))}
        <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium text-muted-foreground border-2 border-card">
          +3
        </div>
      </div>
    </div>
  );
};
