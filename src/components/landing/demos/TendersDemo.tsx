import { useEffect, useRef, useState } from "react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { Sparkles, FileText, CheckCircle2, AlertTriangle, Clock } from "lucide-react";

gsap.registerPlugin(ScrollTrigger);

const analysisSteps = [
  "Analyse du règlement de consultation...",
  "Extraction des critères de sélection...",
  "Identification des pièces requises...",
  "Calcul des délais critiques...",
  "Génération des recommandations...",
];

const criteria = [
  { name: "Valeur technique", weight: 60, score: 85 },
  { name: "Prix", weight: 30, score: 70 },
  { name: "Délais", weight: 10, score: 90 },
];

const documents = [
  { name: "DC1 - Lettre de candidature", status: "done" },
  { name: "DC2 - Déclaration du candidat", status: "done" },
  { name: "Mémoire technique", status: "in-progress" },
  { name: "Planning prévisionnel", status: "pending" },
  { name: "Références similaires", status: "pending" },
];

export const TendersDemo = () => {
  const demoRef = useRef<HTMLDivElement>(null);
  const [currentStep, setCurrentStep] = useState(0);
  const [showResults, setShowResults] = useState(false);
  const [typedText, setTypedText] = useState("");

  useEffect(() => {
    if (!demoRef.current) return;

    const ctx = gsap.context(() => {
      gsap.from(".ai-panel", {
        opacity: 0,
        x: -30,
        duration: 0.6,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 70%",
        },
      });

      gsap.from(".results-panel", {
        opacity: 0,
        x: 30,
        duration: 0.6,
        delay: 0.2,
        ease: "power3.out",
        scrollTrigger: {
          trigger: demoRef.current,
          start: "top 70%",
        },
      });
    }, demoRef);

    return () => ctx.revert();
  }, []);

  // Typewriter effect
  useEffect(() => {
    if (currentStep >= analysisSteps.length) {
      setShowResults(true);
      return;
    }

    const text = analysisSteps[currentStep];
    let charIndex = 0;
    setTypedText("");

    const typeInterval = setInterval(() => {
      if (charIndex < text.length) {
        setTypedText(text.slice(0, charIndex + 1));
        charIndex++;
      } else {
        clearInterval(typeInterval);
        setTimeout(() => {
          setCurrentStep((prev) => prev + 1);
        }, 800);
      }
    }, 40);

    return () => clearInterval(typeInterval);
  }, [currentStep]);

  // Reset animation periodically
  useEffect(() => {
    const resetInterval = setInterval(() => {
      setCurrentStep(0);
      setShowResults(false);
    }, 15000);

    return () => clearInterval(resetInterval);
  }, []);

  return (
    <div ref={demoRef} className="relative bg-card rounded-2xl border border-border/50 p-6 overflow-hidden">
      <div className="grid md:grid-cols-2 gap-6">
        {/* AI Analysis Panel */}
        <div className="ai-panel">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div>
              <h4 className="font-semibold text-foreground text-sm">Analyse IA</h4>
              <p className="text-xs text-muted-foreground">Traitement du DCE...</p>
            </div>
          </div>

          {/* Progress steps */}
          <div className="space-y-3 mb-4">
            {analysisSteps.map((step, index) => (
              <div
                key={index}
                className={`flex items-center gap-2 text-sm transition-opacity duration-300 ${
                  index < currentStep ? "text-emerald-500" : index === currentStep ? "text-primary" : "text-muted-foreground opacity-50"
                }`}
              >
                {index < currentStep ? (
                  <CheckCircle2 className="w-4 h-4 flex-shrink-0" />
                ) : index === currentStep ? (
                  <div className="w-4 h-4 rounded-full border-2 border-primary border-t-transparent animate-spin" />
                ) : (
                  <div className="w-4 h-4 rounded-full border border-muted-foreground/30" />
                )}
                <span className={index === currentStep ? "font-medium" : ""}>
                  {index === currentStep ? typedText : step}
                </span>
              </div>
            ))}
          </div>

          {/* AI typing indicator */}
          {!showResults && (
            <div className="flex items-center gap-2 p-3 bg-primary/5 rounded-lg border border-primary/20">
              <Sparkles className="w-4 h-4 text-primary animate-pulse" />
              <span className="text-sm text-primary">L'IA analyse votre document...</span>
            </div>
          )}
        </div>

        {/* Results Panel */}
        <div className={`results-panel transition-opacity duration-500 ${showResults ? "opacity-100" : "opacity-30"}`}>
          {/* Criteria scores */}
          <div className="mb-6">
            <h4 className="text-sm font-medium text-foreground mb-3 flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Critères de sélection
            </h4>
            <div className="space-y-3">
              {criteria.map((criterion, index) => (
                <div key={index}>
                  <div className="flex justify-between text-xs mb-1">
                    <span className="text-muted-foreground">{criterion.name} ({criterion.weight}%)</span>
                    <span className={`font-medium ${criterion.score >= 80 ? "text-emerald-500" : criterion.score >= 60 ? "text-amber-500" : "text-red-500"}`}>
                      {criterion.score}/100
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-1000 ${
                        criterion.score >= 80 ? "bg-emerald-500" : criterion.score >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}
                      style={{ width: showResults ? `${criterion.score}%` : "0%" }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Documents checklist */}
          <div>
            <h4 className="text-sm font-medium text-foreground mb-3">Pièces à fournir</h4>
            <div className="space-y-2">
              {documents.map((doc, index) => (
                <div key={index} className="flex items-center gap-2 text-xs">
                  {doc.status === "done" ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                  ) : doc.status === "in-progress" ? (
                    <Clock className="w-4 h-4 text-amber-500" />
                  ) : (
                    <AlertTriangle className="w-4 h-4 text-muted-foreground" />
                  )}
                  <span className={doc.status === "done" ? "text-muted-foreground line-through" : "text-foreground"}>
                    {doc.name}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Badge */}
      <div className="absolute top-4 right-4 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg px-3 py-1.5 text-xs font-medium flex items-center gap-1.5">
        <Sparkles className="w-3 h-3" />
        Propulsé par l'IA
      </div>
    </div>
  );
};
