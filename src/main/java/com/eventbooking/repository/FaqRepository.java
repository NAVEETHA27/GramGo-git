package com.eventbooking.repository;

import com.eventbooking.model.Faq;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface FaqRepository extends JpaRepository<Faq, Long> {
    List<Faq> findByActiveTrueOrderByCategoryAscQuestionAsc();
    List<Faq> findByActiveTrueAndCategoryIgnoreCaseOrderByQuestionAsc(String category);
    List<Faq> findByActiveTrueAndQuestionContainingIgnoreCaseOrActiveTrueAndAnswerContainingIgnoreCase(String question, String answer);
}
