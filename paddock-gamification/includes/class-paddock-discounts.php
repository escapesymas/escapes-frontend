<?php

if (!defined('ABSPATH')) {
    exit;
}

class Paddock_Discounts
{

    public static function apply_rank_discount($cart)
    {
        if (is_admin() && !defined('DOING_AJAX'))
            return;

        // Only for logged in users
        if (!is_user_logged_in())
            return;

        $user_id = get_current_user_id();

        // Get Rank Data
        $rank_data = Paddock_XP::get_user_rank_data($user_id);
        $discount_percent = $rank_data['discount'];

        if ($discount_percent > 0) {
            $subtotal = $cart->subtotal;
            $discount_amount = ($subtotal * $discount_percent) / 100;

            // Apply negative fee (discount)
            $cart->add_fee(
                sprintf('Descuento Paddock (%s - %d%%)', $rank_data['title'], $discount_percent),
                -$discount_amount
            );
        }
    }
}
