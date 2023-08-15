import JsLogo from "@/images/jslogo.png";
import WebhookLogo from "@/images/webhook.png";
import ZapierLogo from "@/images/zapier-small.png";
import { Card } from "@formbricks/ui";
import Image from "next/image";

export default function IntegrationsPage({ params }) {
  return (
    <div>
      <h1 className="my-2 text-3xl font-bold text-slate-800">Integrations</h1>
      <p className="mb-6 text-slate-500">Connect Formbricks with your favorite tools.</p>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card
          docsHref="https://formbricks.com/docs/getting-started/nextjs-app"
          docsText="Docs"
          docsNewTab={true}
          label="Javascript Widget"
          description="Integrate Formbricks into your Webapp"
          icon={<Image src={JsLogo} alt="Javascript Logo" />}
        />
        <Card
          docsHref="https://formbricks.com/docs/integrations/zapier"
          docsText="Docs"
          docsNewTab={true}
          connectHref="https://zapier.com/apps/formbricks/integrations"
          connectText="Connect"
          connectNewTab={true}
          label="Zapier"
          description="Integrate Formbricks with 5000+ apps via Zapier"
          icon={<Image src={ZapierLogo} alt="Zapier Logo" />}
        />
        <Card
          connectHref={`/environments/${params.environmentId}/integrations/webhooks`}
          connectText="Manage Webhooks"
          connectNewTab={false}
          docsHref="https://formbricks.com/docs/webhook-api/overview"
          docsText="Docs"
          docsNewTab={true}
          label="Webhooks"
          description="Trigger Webhooks based on actions in your surveys"
          icon={<Image src={WebhookLogo} alt="Webhook Logo" />}
        />
      </div>
    </div>
  );
}
