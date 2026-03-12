import { MultiCodeBlock } from "../../ui/CodeBlock";
import { Callout, H2, Mono, P, PageHeader } from "../../ui/DocComponents";

export function PageTlsMtls() {
  return (
    <div>
      <PageHeader
        badge="Production"
        title="TLS / mTLS"
        description="The control plane uses one-way TLS with service-key auth. Worker-to-worker direct calls use full mTLS. Certificates are provisioned automatically — no cert-manager or Vault needed."
      />

      <H2 id="tls-auto">Server-side auto-generated certs</H2>
      <P>
        On first start, the runtime generates a self-signed CA + server cert in{" "}
        <Mono>./tls</Mono> (configurable via <Mono>SERVICEBRIDGE_TLS_DIR</Mono>) and reuses them
        across restarts. Certs auto-renew 30 days before expiry.
      </P>

      <H2 id="tls-provision">SDK auto-provisioning</H2>
      <P>
        When you call <Mono>serve()</Mono>, the SDK automatically provisions mTLS client
        certificates:
      </P>
      <ol className="list-decimal pl-6 space-y-1 text-muted-foreground text-sm my-3">
        <li>SDK generates an ECDSA P-256 key pair locally.</li>
        <li>
          Sends <strong className="text-foreground">only the public key</strong> to{" "}
          <Mono>POST /api/tls/provision</Mono> (authenticated with the service key).
        </li>
        <li>Server signs the public key and returns a client cert + CA cert.</li>
        <li>
          Worker gRPC server starts with full mTLS.{" "}
          <strong className="text-foreground">The private key never leaves your process.</strong>
        </li>
      </ol>
      <MultiCodeBlock
        code={{
          ts: `// Default — auto-provisions mTLS (just a service key needed)
const sb = servicebridge("server:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "orders");
await sb.serve();  // ← provisions TLS here

// Optional: explicit certs override auto-provisioning
const sb2 = servicebridge("server:14445", process.env.SERVICEBRIDGE_SERVICE_KEY!, "orders", {
  workerTLS: { caCert: CA_PEM, cert: CERT_PEM, key: KEY_PEM },
});

// Local dev: skip TLS entirely
await sb.serve({ skipTLS: true });`,
          go: `// Default — auto-provisions mTLS
svc.Serve(ctx, nil)

// Skip TLS for local dev
svc.Serve(ctx, &servicebridge.ServeOpts{SkipTLS: true})`,
          py: `# Default — auto-provisions mTLS
await sb.serve()

# Skip TLS for local dev
await sb.serve(skip_tls=True)`,
        }}
      />

      <H2 id="tls-arch">Architecture</H2>
      <ul className="list-disc pl-6 space-y-1 text-muted-foreground text-sm my-3">
        <li>
          <strong className="text-foreground">SDK → ServiceBridge runtime:</strong> one-way TLS
          (server cert). Auth via <Mono>x-service-key</Mono> gRPC metadata.
        </li>
        <li>
          <strong className="text-foreground">ServiceBridge runtime → worker:</strong> full mTLS.
          Server presents its cert (CN=ServiceBridge Server).
        </li>
        <li>
          <strong className="text-foreground">Worker → worker (direct RPC):</strong> full mTLS.
          Each side verifies the other's cert was signed by the same CA.
        </li>
        <li>
          If ServiceBridge goes down, direct RPC calls between services continue independently —
          they already have each other's addresses from the last discovery refresh.
        </li>
      </ul>

      <Callout type="tip">
        In Kubernetes or Docker Swarm, set <Mono>SERVICEBRIDGE_GRPC_HOST=0.0.0.0</Mono> and
        expose port <Mono>14445</Mono> so workers in other pods can connect.
      </Callout>

      <Callout type="info">
        mTLS certificates are provisioned per service key. The cert CN is set to the service name
        from the key. See{" "}
        <button
          type="button"
          className="text-primary hover:underline cursor-pointer"
          onClick={() => document.dispatchEvent(new CustomEvent("sb-nav", { detail: "service-keys" }))}
        >
          Service Keys & RBAC
        </button>{" "}
        for key capabilities and per-handler <Mono>allowedCallers</Mono> enforcement.
      </Callout>
    </div>
  );
}
