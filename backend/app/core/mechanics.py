import math

# --- Constants ---
SETUP_FEE = 0.025  # 2.5%
PREMIUM_TAX = 0.04  # 4%
NON_PREMIUM_TAX = 0.08  # 8%

# Resource Return Rates (RRR)
RRR_ISLAND = 0.0
RRR_ROYAL_NO_BONUS = 0.152
RRR_ROYAL_WITH_BONUS = 0.248
RRR_BZ_HO_BASE = 0.28  # Approximate, varies by zone quality/HO level

# --- Formulas ---

def calculate_sell_cost(price: int, quantity: int, is_premium: bool = True) -> float:
    """
    Calculates the total cost (setup fee + tax) of selling an item.
    
    Args:
        price: Sell price per unit.
        quantity: Number of units.
        is_premium: Whether the seller has Premium status.
        
    Returns:
        Total silver cost deducted from the sale.
    """
    gross_value = price * quantity
    setup_fee = gross_value * SETUP_FEE
    tax_rate = PREMIUM_TAX if is_premium else NON_PREMIUM_TAX
    sales_tax = gross_value * tax_rate
    return setup_fee + sales_tax

def calculate_profit(sell_price: int, buy_price: int, quantity: int = 1, is_premium: bool = True) -> float:
    """
    Calculates net profit from flipping or crafting.
    
    Args:
        sell_price: Price item is sold for.
        buy_price: Cost to acquire item (or materials).
        quantity: Number of units.
        is_premium: Whether the seller has Premium status.
        
    Returns:
        Net profit in silver.
    """
    gross_revenue = sell_price * quantity
    total_tax = calculate_sell_cost(sell_price, quantity, is_premium)
    total_cost = buy_price * quantity
    return gross_revenue - total_tax - total_cost

def effective_material_cost(raw_cost: int, rrr_percentage: float) -> float:
    """
    Calculates the effective cost of materials after accounting for Resource Return Rate.
    
    Args:
        raw_cost: Total cost of materials if 0% returned.
        rrr_percentage: Return rate as a percentage (e.g., 24.8 for 24.8%).
        
    Returns:
        Effective material cost.
    """
    return raw_cost * (1 - (rrr_percentage / 100.0))

def calculate_focus_cost(base_focus_cost: int, efficiency_rating: int) -> int:
    """
    Calculates the actual focus cost based on specialization.
    
    Args:
        base_focus_cost: The item's base focus cost.
        efficiency_rating: Total focus efficiency (0-10000). 
                           Usually 100 spec = 10000 efficiency points? 
                           Actually, the formula is: Cost = Base * 0.5 ^ (FocusEfficiency / 10000)
                           Where FocusEfficiency is the sum of mastery/spec bonuses.
                           Max possible is usually around 30000-40000 depending on the tree.
                           Let's assume the input is the raw efficiency value.
        
    Returns:
        Actual focus cost (rounded).
    """
    # Formula: Cost = Base * 0.5 ^ (Efficiency / 10000)
    return round(base_focus_cost * (0.5 ** (efficiency_rating / 10000)))

def calculate_item_power(base_ip: int, tier: int, enchantment: int, quality: int, mastery_bonus: float = 0) -> float:
    """
    Estimates Item Power (IP).
    
    Args:
        base_ip: Base IP of the item at 700 IP standard (usually T4 flat).
        tier: Item tier (4-8).
        enchantment: Enchantment level (0-4).
        quality: Item quality (1-5).
        mastery_bonus: IP bonus from destiny board.
        
    Returns:
        Estimated Item Power.
    """
    # Simplified IP formula
    # Tier bonus: +100 per tier above 4
    tier_bonus = (tier - 4) * 100
    # Enchantment bonus: +100 per level (roughly)
    enchant_bonus = enchantment * 100
    # Quality bonus: 1=0, 2=10, 3=20, 4=50, 5=100
    quality_map = {1: 0, 2: 10, 3: 20, 4: 50, 5: 100}
    quality_bonus = quality_map.get(quality, 0)
    
    return base_ip + tier_bonus + enchant_bonus + quality_bonus + mastery_bonus
