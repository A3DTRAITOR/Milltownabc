import { PublicLayout } from "@/components/layout/PublicLayout";
import { SEOHead } from "@/components/SEOHead";
import { Card } from "@/components/ui/card";
import { Shield, UserCheck, Users, Eye, AlertTriangle, CheckCircle } from "lucide-react";

export default function Safety() {
  return (
    <PublicLayout>
      <SEOHead 
        title="Safety Policy - Mill Town ABC" 
        description="Safety policies and club rules at Mill Town ABC. We are committed to providing safe training conditions for all members." 
      />
      
      <section className="bg-foreground py-16 lg:py-24">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 text-center">
          <span className="inline-block px-4 py-1 mb-4 text-sm font-semibold tracking-wider text-primary uppercase bg-primary/10 rounded-full">
            Club Rules
          </span>
          <h1 className="text-4xl font-black tracking-tight text-white sm:text-5xl uppercase" data-testid="text-safety-title">
            Safety Policy
          </h1>
          <p className="mt-6 text-lg leading-relaxed text-gray-300 lg:text-xl">
            At Mill Town ABC, the safety and wellbeing of all our members is our top priority. Please read and follow these guidelines.
          </p>
        </div>
      </section>

      <section className="py-16 lg:py-24 bg-background">
        <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 space-y-8">
          
          <Card className="p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary shrink-0">
                <Shield className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground uppercase mb-4">We Will:</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Provide safe training conditions and safe equipment</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Promote good practice and appropriate supervision</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Ensure suitable first aid and emergency arrangements</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Maintain clean, hygienic facilities</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Encourage a culture where safety concerns are reported and acted upon</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Comply with all relevant health & safety legislation and governing body requirements</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary shrink-0">
                <UserCheck className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground uppercase mb-4">Coach Responsibilities:</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Safe delivery of sessions and appropriate supervision</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Assessing participant fitness and ability before contact training</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Enforcing club rules and ensuring protective equipment is used</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Stopping any activity if safety is compromised</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Ensuring warm-ups, cool-downs, and safe progressions are used</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Ensuring only approved techniques and drills are taught</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary shrink-0">
                <Users className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground uppercase mb-4">All Members Must:</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Follow coaching instructions and club rules</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Use equipment correctly and wear required protective gear</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Report injuries, symptoms, hazards, or unsafe behaviour</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Train within their ability and not participate while unfit or injured</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Respect others and avoid reckless or dangerous conduct</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary shrink-0">
                <Eye className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground uppercase mb-4">Visitors & Spectators Must:</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Stay within designated safe areas</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Follow instructions from club staff</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Not interfere with training sessions</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:p-8">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-primary/10 p-3 text-primary shrink-0">
                <CheckCircle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground uppercase mb-4">All Sessions Must Include:</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>A structured warm-up</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Technical instruction appropriate to the group</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>Safe conditioning work</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                    <span>A cool-down and stretching (where appropriate)</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

          <Card className="p-6 lg:p-8 border-destructive/50 bg-destructive/5">
            <div className="flex items-start gap-4">
              <div className="rounded-lg bg-destructive/10 p-3 text-destructive shrink-0">
                <AlertTriangle className="h-6 w-6" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-foreground uppercase mb-4">The Following Are Not Permitted:</h2>
                <ul className="space-y-3 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">×</span>
                    <span>Bullying, intimidation, or aggressive behaviour</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">×</span>
                    <span>Training under the influence of drugs or alcohol</span>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-destructive font-bold">×</span>
                    <span>Deliberate dangerous techniques (e.g., strikes to back of head/spine)</span>
                  </li>
                </ul>
              </div>
            </div>
          </Card>

        </div>
      </section>
    </PublicLayout>
  );
}
