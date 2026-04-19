package dev.riss.fsm.shared.moderation

import org.springframework.stereotype.Component

@Component
class ProfanityFilter {
    fun containsProfanity(text: String): Boolean {
        if (text.isBlank()) return false
        val normalized = text.lowercase()
        return PROHIBITED_TERMS.any { term -> normalized.contains(term) }
    }

    companion object {
        val PROHIBITED_TERMS: Set<String> = setOf(
            "씨발",
            "시발",
            "개새끼",
            "좆",
            "좇",
            "병신",
            "ㅂㅅ",
            "ㅅㅂ",
            "fuck",
            "shit",
            "bitch",
            "asshole",
            "dick",
            "bastard",
        )
    }
}
