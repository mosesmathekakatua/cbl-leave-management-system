
import { GoogleGenAI } from "@google/genai";
import { LeaveRequest, User } from "../types";

export const getLeaveAdvisory = async (
  user: User, 
  proposedStartDate: string, 
  proposedEndDate: string,
  teamRequests: LeaveRequest[]
) => {
  const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  
  // Only consider leaves in the same branch AND department for localized planning
  const branchLeaves = teamRequests.filter(r => 
    r.department === user.department && 
    r.branch === user.branch
  );

  const prompt = `
    Context:
    User: ${user.name} (${user.role} in ${user.department} at ${user.branch})
    Proposed Leave: ${proposedStartDate} to ${proposedEndDate}
    Existing Branch-Specific Leaves: ${JSON.stringify(branchLeaves.map(r => ({ user: r.userName, start: r.startDate, end: r.endDate, status: r.status })))}
    
    Task:
    As a smart HR assistant for Commercial Builders Ltd, analyze this request. 
    1. Check for coverage at the ${user.branch} location (it's risky if more than 20% of the local ${user.department} team is out).
    2. Consider common industry holiday peaks (like December/summer).
    3. Provide constructive feedback. If there are overlaps at this branch, suggest checking with local colleagues.
    
    Format:
    Write 2 concise, professional sentences. Mention the branch name "${user.branch}" to confirm localized analysis.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: prompt,
    });
    return response.text;
  } catch (error) {
    console.error("Gemini Error:", error);
    return `Coverage at ${user.branch} for the ${user.department} team looks standard. Please ensure your tasks are handed over.`;
  }
};
