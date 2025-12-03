import React, { useEffect, useState } from 'react';
import { ItemType, SpecializationLevels, calculateFocusEfficiency, SPECIALIZATION_COEFFICIENTS } from '../lib/specialization';

interface DestinyBoardInputProps {
    type: ItemType;
    values: SpecializationLevels;
    onChange: (values: SpecializationLevels) => void;
    label?: string;
}

export default function DestinyBoardInput({ type, values, onChange, label = "Destiny Board" }: DestinyBoardInputProps) {
    const [efficiency, setEfficiency] = useState(0);
    const [showAdvanced, setShowAdvanced] = useState(false);

    useEffect(() => {
        setEfficiency(calculateFocusEfficiency(values, type));
    }, [values, type]);

    const handleChange = (key: keyof SpecializationLevels, value: number) => {
        onChange({ ...values, [key]: value });
    };

    const coeffs = SPECIALIZATION_COEFFICIENTS[type];

    return (
        <div className="bg-gray-800/50 rounded-lg p-4 border border-gray-700">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-gray-200 flex items-center gap-2">
                    <span>📜</span> {label}
                </h3>
                <div className="text-right">
                    <div className="text-xs text-gray-400">Focus Cost Efficiency</div>
                    <div className="text-xl font-bold text-blue-400">{efficiency.toLocaleString()}</div>
                </div>
            </div>

            <div className="space-y-4">
                {/* Mastery Level */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Mastery Level</span>
                        <span className="text-gray-400">{values.mastery}/100</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={values.mastery}
                        onChange={(e) => handleChange('mastery', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-blue-500"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                        +{coeffs.mastery} efficiency per level (Total: {values.mastery * coeffs.mastery})
                    </div>
                </div>

                {/* Specialization Level */}
                <div>
                    <div className="flex justify-between text-sm mb-1">
                        <span className="text-gray-300">Specialization Level</span>
                        <span className="text-gray-400">{values.specialization}/100</span>
                    </div>
                    <input
                        type="range"
                        min="0"
                        max="100"
                        value={values.specialization}
                        onChange={(e) => handleChange('specialization', parseInt(e.target.value))}
                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-green-500"
                    />
                    <div className="text-xs text-gray-500 mt-1">
                        +{coeffs.specUnique} efficiency per level (Total: {values.specialization * coeffs.specUnique})
                    </div>
                </div>

                {/* Advanced Toggle */}
                {type !== 'refining' && (
                    <div>
                        <button
                            onClick={() => setShowAdvanced(!showAdvanced)}
                            className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 transition-colors"
                        >
                            {showAdvanced ? '▼' : '▶'} Advanced (Mutual Bonuses)
                        </button>

                        {showAdvanced && (
                            <div className="mt-3 pl-3 border-l-2 border-gray-700 space-y-3">
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-300">Other Items in Group</span>
                                        <span className="text-gray-400">{values.numberOfOtherItems || 0} items</span>
                                    </div>
                                    <input
                                        type="number"
                                        min="0"
                                        max="10"
                                        value={values.numberOfOtherItems || 0}
                                        onChange={(e) => handleChange('numberOfOtherItems', parseInt(e.target.value))}
                                        className="w-full bg-gray-900 border border-gray-600 rounded px-2 py-1 text-sm text-gray-200"
                                    />
                                </div>
                                <div>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-gray-300">Avg Level of Others</span>
                                        <span className="text-gray-400">{values.otherSpecsAverage || 0}/100</span>
                                    </div>
                                    <input
                                        type="range"
                                        min="0"
                                        max="100"
                                        value={values.otherSpecsAverage || 0}
                                        onChange={(e) => handleChange('otherSpecsAverage', parseInt(e.target.value))}
                                        className="w-full h-2 bg-gray-700 rounded-lg appearance-none cursor-pointer accent-purple-500"
                                    />
                                    <div className="text-xs text-gray-500 mt-1">
                                        +{coeffs.specMutual} efficiency per level per item
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
