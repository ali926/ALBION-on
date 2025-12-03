/**
 * Transport Risk Calculator
 * Calculates the Expected Value (EV) of transporting goods through dangerous zones.
 */

export type MountType = 'Ox' | 'Bear' | 'Boar' | 'Spectral' | 'Mammoth';
export type RiskProfile = 'Safe' | 'Standard' | 'Risky' | 'Suicide';

export interface TransportRiskInput {
    cargoValue: number;      // Value of items being transported
    craftCost: number;       // Cost to craft the items
    mountType: MountType;    // Type of mount used
    riskProfile: RiskProfile; // Selected risk level
}

export interface TransportRiskOutput {
    successProfit: number;   // Profit if you survive (100% chance)
    failureLoss: number;     // Loss if you die (Material Cost + Gear Cost)
    expectedValue: number;   // Weighted average profit
    breakEvenRate: number;   // Minimum survival rate needed to profit
    isRecommended: boolean;  // Is EV > 0?
    gearCost: number;        // Estimated cost of mount + gear
    survivalRate: number;    // Probability of survival (0-1)
    riskLevel: RiskProfile;  // The risk profile used
}

export interface MountStats {
    name: string;
    cost: number;        // Estimated cost of mount + gear
    speed: string;       // Description
    capacity: string;    // Description
    resilience: string;  // Description
}

export const MOUNT_DATA: Record<MountType, MountStats> = {
    'Ox': {
        name: "Transport Ox (T8)",
        cost: 250000,
        speed: "Very Slow",
        capacity: "Huge",
        resilience: "Low (Easy Target)"
    },
    'Bear': {
        name: "Elite Winter Bear",
        cost: 1500000,
        speed: "Medium",
        capacity: "High",
        resilience: "High (Tanky)"
    },
    'Boar': {
        name: "Wild Boar",
        cost: 800000,
        speed: "Fast",
        capacity: "Medium",
        resilience: "Medium"
    },
    'Spectral': {
        name: "Spectral Direboar",
        cost: 2500000,
        speed: "Very Fast",
        capacity: "Medium",
        resilience: "Medium (Invis)"
    },
    'Mammoth': {
        name: "Transport Mammoth",
        cost: 140000000,
        speed: "Slow",
        capacity: "Massive",
        resilience: "Very High"
    }
};

export const RISK_PROFILES: Record<RiskProfile, { name: string; survivalRate: number; description: string }> = {
    'Safe': {
        name: "Safe Run",
        survivalRate: 0.98,
        description: "Scouted, off-hours, fast mount, skip if hostile count > 0"
    },
    'Standard': {
        name: "Standard Run",
        survivalRate: 0.90,
        description: "Careful, tanky mount, checking map, avoiding main roads"
    },
    'Risky': {
        name: "Risky Run",
        survivalRate: 0.80,
        description: "Rush hour, slow mount, no scout, main roads"
    },
    'Suicide': {
        name: "Suicide Run",
        survivalRate: 0.50,
        description: "Naked on an ox through a gate camp"
    }
};

export function calculateTransportRisk(input: TransportRiskInput): TransportRiskOutput {
    const { cargoValue, craftCost, mountType, riskProfile } = input;

    const mountStats = MOUNT_DATA[mountType];
    const riskStats = RISK_PROFILES[riskProfile];

    // 1. Success Scenario (You live)
    // Profit = Revenue - Cost
    // Note: Taxes are already deducted from cargoValue in the main calculator
    const successProfit = cargoValue - craftCost;

    // 2. Failure Scenario (You die)
    // Loss = -(Material Cost + Gear Cost)
    // You lose everything you invested
    const failureLoss = -(craftCost + mountStats.cost);

    // 3. Expected Value (EV)
    // EV = (Win * P_Win) + (Loss * P_Loss)
    const pSuccess = riskStats.survivalRate;
    const pFailure = 1 - pSuccess;

    const expectedValue = (successProfit * pSuccess) + (failureLoss * pFailure);

    // 4. Break Even Rate
    // At what survival rate is EV = 0?
    // 0 = (Profit * x) + (Loss * (1-x))
    // 0 = Px + L - Lx
    // -L = Px - Lx
    // -L = x(P - L)
    // x = -L / (P - L)
    // Note: Loss is negative, so -Loss is positive
    const totalRiskAmount = successProfit - failureLoss; // Total swing
    const breakEvenRate = totalRiskAmount !== 0
        ? Math.abs(failureLoss) / (successProfit + Math.abs(failureLoss))
        : 0;

    return {
        successProfit,
        failureLoss,
        expectedValue,
        breakEvenRate: breakEvenRate * 100, // Convert to percentage
        isRecommended: expectedValue > 0,
        gearCost: mountStats.cost,
        survivalRate: riskStats.survivalRate * 100,
        riskLevel: riskProfile
    };
}
