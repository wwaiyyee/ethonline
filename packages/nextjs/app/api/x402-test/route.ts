import { NextResponse } from "next/server";
import { getResourceServer } from "~~/services/x402/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const server = await getResourceServer();
    const methods = Object.getOwnPropertyNames(Object.getPrototypeOf(server));

    return NextResponse.json({
      success: true,
      methods,
      hasBuildPaymentRequirementsFromOptions: typeof (server as any).buildPaymentRequirementsFromOptions === "function",
      hasVerifyPayment: typeof (server as any).verifyPayment === "function",
      hasSettlePayment: typeof (server as any).settlePayment === "function",
      hasFindMatchingRequirements: typeof (server as any).findMatchingRequirements === "function",
    });
  } catch (error) {
    return NextResponse.json(
      {
        success: false,
        error: String(error),
      },
      { status: 500 },
    );
  }
}
