"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const github = __importStar(require("@actions/github"));
const httpm = __importStar(require("@actions/http-client"));
const http = new httpm.HttpClient("client");
function getAccessToken(clientId, clientSecret) {
    return __awaiter(this, void 0, void 0, function* () {
        const response = yield http.post("https://sso.dynatrace.com/sso/oauth2/token", `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}&scope=storage:events:write`, {
            "content-type": "application/x-www-form-urlencoded",
        });
        const body = JSON.parse(yield response.readBody());
        return body.access_token;
    });
}
function buildCloudEvent(payload) {
    const workflowRun = payload.workflow_run;
    return {
        specversion: "1.0",
        id: `${workflowRun.id}`,
        type: "com.dynatrace.github.workflow.run",
        source: "dynatrace-workflow-ingester",
        data: Object.assign(Object.assign({}, workflowRun), { run_duration_ms: new Date(workflowRun.updated_at).getTime() -
                new Date(workflowRun.run_started_at).getTime() }),
    };
}
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        try {
            const apiToken = core.getInput("dt-api-token"); // Assuming 'dt-api-token' is the name of the input for the API token
            const environmentId = core.getInput("dt-environment-id");
            const cloudEvent = buildCloudEvent(github.context.payload);
            const response = yield http.post(`https://${environmentId}.live.dynatrace.com/api/v2/bizevents/ingest`, JSON.stringify(cloudEvent), {
                "content-type": "application/cloudevent+json",
                authorization: `Api-Token ${apiToken}`, // Use the API token directly for authentication
            });
            core.info(yield response.readBody());
        }
        catch (error) {
            if (error instanceof Error)
                core.setFailed(error.message);
        }
    });
}
run();
// async function run(): Promise<void> {
//   try {
//     const clientId = core.getInput('dt-client-id')
//     const clientSecret = core.getInput('dt-client-secret')
//     const environmentId = core.getInput('dt-environment-id')
//     const cloudEvent = buildCloudEvent(github.context.payload)
//     const dynatraceAccessToken = await getAccessToken(clientId, clientSecret)
//     const response = await http.post(
//       `https://${environmentId}.live.dynatrace.com/api/v2/bizevents/ingest`,
//       JSON.stringify(cloudEvent),
//       {
//         'content-type': 'application/cloudevent+json',
//         authorization: `Bearer ${dynatraceAccessToken}`
//       }
//     )
//     core.info(await response.readBody())
//   } catch (error) {
//     if (error instanceof Error) core.setFailed(error.message)
//   }
// }
run();
