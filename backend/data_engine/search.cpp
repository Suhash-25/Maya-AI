#include <iostream>
#include <fstream>
#include <string>
#include <vector>
#include <algorithm>
#include <cmath>
#include <map>
#include <sstream>

std::string clean(std::string s) {
    std::string res;
    for (char c : s) if (isalnum(c)) res += tolower(c);
    return res;
}

// ELITE MATH: Cosine Similarity
// Formula: (A . B) / (||A|| * ||B||)
double getSimilarity(std::string s1, std::string s2) {
    std::map<std::string, int> f1, f2;
    std::string w;
    std::stringstream ss1(s1), ss2(s2);
    
    while (ss1 >> w) f1[clean(w)]++;
    while (ss2 >> w) f2[clean(w)]++;

    double dot = 0, m1 = 0, m2 = 0;
    for (auto const& [word, count] : f1) {
        dot += count * f2[word];
        m1 += std::pow(count, 2);
    }
    for (auto const& [word, count] : f2) m2 += std::pow(count, 2);

    if (m1 == 0 || m2 == 0) return 0;
    return dot / (std::sqrt(m1) * std::sqrt(m2));
}

std::string getVibe(std::string q) {
    std::vector<std::string> pos = {"happy", "great", "cool", "love", "yes", "work", "finally", "done"};
    std::vector<std::string> neg = {"error", "bad", "stop", "no", "fix", "stuck", "hard", "bug"};
    int s = 0;
    for (auto w : pos) if (q.find(w) != std::string::npos) s++;
    for (auto w : neg) if (q.find(w) != std::string::npos) s--;
    return (s > 0) ? "POSITIVE" : (s < 0) ? "FRUSTRATED" : "NEUTRAL";
}

int main(int argc, char* argv[]) {
    if (argc < 2) return 1;
    std::string query;
    for (int i = 1; i < argc; ++i) query += std::string(argv[i]) + " ";

    std::ifstream file("knowledge.txt");
    std::string line, bestMatch = "No specific local data found.";
    double maxSim = 0.25;

    while (std::getline(file, line)) {
        if (line.empty() || line[0] == '#') continue;
        double sim = getSimilarity(query, line);
        if (sim > maxSim) {
            maxSim = sim;
            bestMatch = line;
        }
    }

    std::cout << bestMatch << " | " << getVibe(query) << std::endl;
    return 0;
}