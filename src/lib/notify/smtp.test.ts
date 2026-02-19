import { describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => {
  const sendMail = vi.fn(async () => ({ messageId: "x" }));
  const createTransport = vi.fn(() => ({ sendMail }));
  return { sendMail, createTransport };
});

vi.mock("nodemailer", () => ({
  default: { createTransport: mocks.createTransport },
}));

import { sendSmtp } from "@/lib/notify/smtp";

describe("sendSmtp", () => {
  it("builds transport and sends email", async () => {
    await sendSmtp(
      {
        host: "smtp.example.com",
        port: 587,
        from: "alerts@example.com",
        to: "you@example.com",
        user: "u",
        pass: "p",
      },
      {
        title: "Alert",
        message: "Body",
        url: "https://example.com/item",
      },
    );

    expect(mocks.createTransport).toHaveBeenCalledTimes(1);
    expect(mocks.sendMail).toHaveBeenCalledTimes(1);
    const payload = mocks.sendMail.mock.calls[0]?.[0] as { subject: string; text: string };
    expect(payload.subject).toBe("Alert");
    expect(payload.text).toContain("https://example.com/item");
  });
});
