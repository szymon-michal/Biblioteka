package com.library.book;

import jakarta.persistence.criteria.Expression;
import org.springframework.data.jpa.domain.Specification;

public class BookSpecification {

  public static <T> Specification<T> titleContainsIgnoreCase(String query) {
    return (root, cq, cb) -> {
      if (query == null || query.isBlank()) {
        return cb.conjunction();
      }
      Expression<?> rawTitle = root.get("title");
      Expression<String> titleExpression;
      if (byte[].class.equals(rawTitle.getJavaType())) {
        titleExpression =
          cb.function(
            "convert_from",
            String.class,
            rawTitle.as(byte[].class),
            cb.literal("UTF8")
          );
      } else {
        titleExpression = rawTitle.as(String.class);
      }
      String normalized = "%" + query.trim().toLowerCase() + "%";
      return cb.like(cb.lower(titleExpression), normalized);
    };
  }
  // ...existing code...
}
