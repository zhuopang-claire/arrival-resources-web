export default function Footer() {
  return (
    <footer className="app-footer">
      <div style={{ maxWidth: "1100px", margin: "20px auto", width: "100%" }}>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 text-left">
        <div>
            <p className="text-sm font-semibold text-foreground mb-2">Project Credit</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Making Space for Arrival - A PhD research project<br />
              Developed by Claire Zhuo Pang, University of Sheffield.
            </p>
          </div>
          
          
          <div>
            <p className="text-sm font-semibold text-foreground mb-2">Data & Limitations</p>
            <p className="text-sm text-muted-foreground leading-relaxed">
              This map compiles publicly available information from online sources and third-party platforms. It is exploratory and non-exhaustive; details may be incomplete or outdated. Please verify information directly with service providers.
            </p>
            <p className="text-sm text-muted-foreground mt-3">
              For corrections, additions, or comments, please use the <a href="/feedback" className="underline hover:text-foreground">Feedback page</a>.
            </p>
          </div>
          
         
        </div>
      </div>
    </footer>
  );
}

